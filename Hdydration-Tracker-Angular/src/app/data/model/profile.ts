class Profile {
    public id: string;
    public email: string;
    public role: string;
    public created_at: Date;
    public updated_at: Date;

    constructor(id: string, email: string, role: string, created_at: Date, updated_at: Date) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }   
}

export {Profile};