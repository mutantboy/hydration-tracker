// In entry.ts
class HydrationEntry {
    public id: number;
    public user_id: string;
    public amount: number;
    public created_at: string | Date;

    constructor(id: number, user_id: string, amount: number, created_at: string | Date) {
        this.id = id;
        this.user_id = user_id;
        this.amount = amount;
        this.created_at = created_at;
    }

    getDate(): Date {
        if (this.created_at instanceof Date) {
            return this.created_at;
        }
        return new Date(this.created_at);
    }
}

export {HydrationEntry}