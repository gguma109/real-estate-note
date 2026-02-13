import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'listings.json');

// Ensure data file exists
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([]));
}

export const getListings = () => {
    try {
        const fileData = fs.readFileSync(dataFilePath, 'utf-8');
        return JSON.parse(fileData);
    } catch (error) {
        return [];
    }
};

export const saveListings = (listings) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(listings, null, 2));
        return true;
    } catch (error) {
        console.error("Failed to save listings:", error);
        return false;
    }
};

export const getListingById = (id) => {
    const listings = getListings();
    return listings.find(listing => listing.id === id);
};

export const createListing = (data) => {
    const listings = getListings();
    const newListing = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    listings.unshift(newListing); // Add to top
    saveListings(listings);
    return newListing;
};

export const updateListing = (id, data) => {
    const listings = getListings();
    const index = listings.findIndex(l => l.id === id);
    if (index !== -1) {
        listings[index] = { ...listings[index], ...data, updatedAt: new Date().toISOString() };
        saveListings(listings);
        return listings[index];
    }
    return null;
};

export const deleteListing = (id) => {
    let listings = getListings();
    const initialLength = listings.length;
    listings = listings.filter(l => l.id !== id);
    if (listings.length !== initialLength) {
        saveListings(listings);
        return true;
    }
    return false;
};
