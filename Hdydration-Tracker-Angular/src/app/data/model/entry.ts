class HydrationEntry {
    public id: number;
    public user_id: string;
    public amount: number;
    public created_at: Date;


    constructor(id: number, user_id: string, amount: number, created_at: Date) {
        this.id = id;
        this.user_id = user_id;
        this.amount = amount;
        this.created_at = created_at;
    }
}

export {HydrationEntry}