CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rentals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT,
    date TEXT,
    movein TEXT,
    address TEXT,
    room TEXT,
    deposit TEXT,
    premium TEXT,
    rent TEXT,
    yearly_rent TEXT,
    maintenance TEXT,
    inc_internet BOOLEAN DEFAULT 0,
    inc_tv BOOLEAN DEFAULT 0,
    inc_water BOOLEAN DEFAULT 0,
    options TEXT,
    special_notes TEXT,
    phone TEXT,
    common_pwd TEXT,
    unit_pwd TEXT,
    business_name TEXT,
    exclusive_area TEXT,
    supply_area TEXT,
    land_area TEXT,
    total_floor_area TEXT,
    sale_price TEXT,
    current_loan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS moveouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    contract_type TEXT,
    room_type TEXT,
    tenant_name TEXT,
    address TEXT,
    room TEXT,
    current_pwd TEXT,
    new_pwd TEXT,
    empty_status TEXT,
    cleaning_status TEXT,
    damage_status TEXT,
    gas_status TEXT,
    water_status TEXT,
    electric_status TEXT,
    refund_bank TEXT,
    refund_account TEXT,
    refund_owner TEXT,
    form_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    content TEXT,
    is_shared BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
