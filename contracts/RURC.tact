import "@stdlib/deploy";
import "@stdlib/ownable";

// ============================================================
//  RURC Jetton — Tact Smart Contract
//  Стандарт: TEP-74 (Jetton)
//  Сеть: TON (Testnet / Mainnet)
//  Supply: 1 000 000 000 RURC
//  Decimals: 9
//  Владелец: задаётся при деплое
// ============================================================

message Mint {
    amount: Int as coins;
    receiver: Address;
}

message BurnNotification {
    amount: Int as coins;
    sender: Address;
    responseDestination: Address?;
}

message(0x178d4519) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x7362d09c) TokenTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    responseDestination: Address?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x595f07bc) TokenBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    responseDestination: Address?;
}

struct JettonData {
    totalSupply: Int as coins;
    mintable: Bool;
    owner: Address;
    content: Cell;
    walletCode: Cell;
}

// ── Jetton Wallet ────────────────────────────────────────────
contract RURCWallet {
    balance: Int as coins = 0;
    owner: Address;
    master: Address;

    init(owner: Address, master: Address) {
        self.owner = owner;
        self.master = master;
    }

    receive(msg: TokenTransferInternal) {
        let ctx: Context = context();
        require(ctx.sender == self.master || ctx.sender == contractAddress(initOf RURCWallet(msg.from, self.master)), "Unauthorized");
        self.balance += msg.amount;
        if (msg.forwardTonAmount > 0) {
            send(SendParameters{
                to: self.owner,
                value: msg.forwardTonAmount,
                bounce: false,
                body: msg.forwardPayload.asCell()
            });
        }
        if (msg.responseDestination != null) {
            send(SendParameters{
                to: msg.responseDestination!!,
                value: 0,
                mode: SendRemainingValue,
                bounce: false,
                body: beginCell().storeUint(0xd53276db, 32).storeUint(msg.queryId, 64).endCell()
            });
        }
    }

    receive(msg: TokenTransfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only owner can transfer");
        require(self.balance >= msg.amount, "Insufficient balance");
        self.balance -= msg.amount;
        let walletInit: StateInit = initOf RURCWallet(msg.destination, self.master);
        send(SendParameters{
            to: contractAddress(walletInit),
            value: msg.forwardTonAmount + ton("0.05"),
            bounce: true,
            mode: SendPayGasSeparately,
            body: TokenTransferInternal{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                responseDestination: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload
            }.toCell(),
            code: walletInit.code,
            data: walletInit.data
        });
    }

    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only owner can burn");
        require(self.balance >= msg.amount, "Insufficient balance");
        self.balance -= msg.amount;
        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: BurnNotification{
                amount: msg.amount,
                sender: self.owner,
                responseDestination: msg.responseDestination
            }.toCell()
        });
    }

    get fun balance(): Int { return self.balance; }
    get fun owner(): Address { return self.owner; }
}

// ── Jetton Master (Minter) ───────────────────────────────────
contract RURCJetton with Deployable, Ownable {
    owner: Address;
    totalSupply: Int as coins;
    mintable: Bool;
    content: Cell;

    // Константы
    const MAX_SUPPLY: Int = 1_000_000_000_000_000_000; // 1B * 10^9 (decimals=9)

    init(owner: Address, content: Cell) {
        self.owner = owner;
        self.totalSupply = 0;
        self.mintable = true;
        self.content = content;
    }

    // ── Минт (только владелец) ───────────────────────────────
    receive(msg: Mint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only owner can mint");
        require(self.mintable, "Minting is disabled");
        require(self.totalSupply + msg.amount <= self.MAX_SUPPLY, "Exceeds max supply");

        self.totalSupply += msg.amount;
        let walletInit: StateInit = initOf RURCWallet(msg.receiver, myAddress());
        send(SendParameters{
            to: contractAddress(walletInit),
            value: ton("0.05"),
            bounce: false,
            mode: SendPayGasSeparately,
            body: TokenTransferInternal{
                queryId: 0,
                amount: msg.amount,
                from: myAddress(),
                responseDestination: self.owner,
                forwardTonAmount: 0,
                forwardPayload: emptySlice()
            }.toCell(),
            code: walletInit.code,
            data: walletInit.data
        });
    }

    // ── Burn notification от кошелька ────────────────────────
    receive(msg: BurnNotification) {
        self.totalSupply -= msg.amount;
        if (msg.responseDestination != null) {
            send(SendParameters{
                to: msg.responseDestination!!,
                value: 0,
                mode: SendRemainingValue,
                bounce: false,
                body: beginCell().storeUint(0xd53276db, 32).storeUint(0, 64).endCell()
            });
        }
    }

    // ── Отключить минтинг (навсегда) ────────────────────────
    receive("Stop Minting") {
        require(sender() == self.owner, "Only owner");
        self.mintable = false;
    }

    // ── Getter: данные токена ────────────────────────────────
    get fun getJettonData(): JettonData {
        return JettonData{
            totalSupply: self.totalSupply,
            mintable: self.mintable,
            owner: self.owner,
            content: self.content,
            walletCode: initOf RURCWallet(self.owner, myAddress()).code
        };
    }

    get fun getWalletAddress(owner: Address): Address {
        return contractAddress(initOf RURCWallet(owner, myAddress()));
    }
}
