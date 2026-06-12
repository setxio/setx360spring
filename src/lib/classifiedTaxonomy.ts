export type FilterConfig = {
  id: string;
  label: string;
  type: 'select' | 'text';
  options?: string[];
};

export type ItemTypeConfig = {
  name: string;
  filters: FilterConfig[];
};

export type SubCategoryConfig = {
  name: string;
  types: ItemTypeConfig[];
};

export type CategoryConfig = {
  name: string;
  subcategories: SubCategoryConfig[];
};

const COMMON_CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair', 'Refurbished', 'Parts Only'];
const COMMON_APPAREL_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Other'];
const COMMON_SHOE_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', 'Other'];
const SUIT_PIECES = ['Shirt', 'Pants', 'Jacket', 'Full Suit'];
const TOOL_POWER_SOURCES = ['Corded Electric', 'Cordless/Battery', 'Gas Powered', 'Pneumatic', 'Manual'];

export const CATEGORY_TAXONOMY: CategoryConfig[] = [
  {
    name: 'Vehicles & Powersports',
    subcategories: [
      {
        name: 'Cars & Trucks',
        types: [
          { name: 'Sedans & Coupes', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'mileage', label: 'Mileage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'SUVs & Crossovers', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'mileage', label: 'Mileage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Trucks', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'mileage', label: 'Mileage', type: 'text' }, { id: 'drive', label: 'Drivetrain (4x4, 2WD)', type: 'select', options: ['4x4', '2WD', 'AWD'] }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Vans & Minivans', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'mileage', label: 'Mileage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Powersports & ATVs',
        types: [
          { name: '4-Wheelers & ATVs', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'hours', label: 'Hours/Mileage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Side-by-Sides (UTVs)', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'hours', label: 'Hours/Mileage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Dirt Bikes', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Golf Carts', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'power', label: 'Gas or Electric', type: 'select', options: ['Gas', 'Electric'] }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Motorcycles & Scooters',
        types: [
          { name: 'Street Bikes & Cruisers', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'mileage', label: 'Mileage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Mopeds & Scooters', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'cc', label: 'Engine Size (cc)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'RVs & Campers',
        types: [
          { name: 'Travel Trailers & 5th Wheels', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'length', label: 'Length (ft)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Motorhomes & Camper Vans', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'mileage', label: 'Mileage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Watercraft',
        types: [
          { name: 'Boats (Fishing, Pontoon, etc)', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'length', label: 'Length (ft)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Jet Skis & PWCs', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'year', label: 'Year', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Kayaks & Canoes', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Trailers & Utility',
        types: [
          { name: 'Utility & Flatbed Trailers', filters: [{ id: 'size', label: 'Dimensions', type: 'text' }, { id: 'axles', label: 'Axles', type: 'select', options: ['Single Axle', 'Tandem Axle', 'Triple Axle'] }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Enclosed Trailers', filters: [{ id: 'size', label: 'Dimensions', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Car Haulers & Equipment', filters: [{ id: 'capacity', label: 'Weight Capacity', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Heavy Equipment',
        types: [
          { name: 'Tractors', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'hours', label: 'Hours', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Construction (Skid Steers, etc)', filters: [{ id: 'make', label: 'Make', type: 'text' }, { id: 'type', label: 'Equipment Type', type: 'text' }, { id: 'hours', label: 'Hours', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Property Rentals & Home Sales',
    subcategories: [
      {
        name: 'Residential Rentals',
        types: [
          { name: 'Apartments for Rent', filters: [{ id: 'beds', label: 'Bedrooms', type: 'text' }, { id: 'baths', label: 'Bathrooms', type: 'text' }, { id: 'pet_friendly', label: 'Pet Friendly', type: 'select', options: ['Yes', 'No'] }] },
          { name: 'Houses for Rent', filters: [{ id: 'beds', label: 'Bedrooms', type: 'text' }, { id: 'baths', label: 'Bathrooms', type: 'text' }, { id: 'pet_friendly', label: 'Pet Friendly', type: 'select', options: ['Yes', 'No'] }] },
          { name: 'Mobile/Trailer Homes for Rent', filters: [{ id: 'beds', label: 'Bedrooms', type: 'text' }, { id: 'baths', label: 'Bathrooms', type: 'text' }, { id: 'pet_friendly', label: 'Pet Friendly', type: 'select', options: ['Yes', 'No'] }] },
          { name: 'Rooms & Shares', filters: [{ id: 'furnished', label: 'Furnished', type: 'select', options: ['Yes', 'No'] }] }
        ]
      },
      {
        name: 'Residential Sales',
        types: [
          { name: 'Houses for Sale', filters: [{ id: 'beds', label: 'Bedrooms', type: 'text' }, { id: 'baths', label: 'Bathrooms', type: 'text' }, { id: 'sqft', label: 'Square Footage', type: 'text' }] },
          { name: 'Townhomes & Condos', filters: [{ id: 'beds', label: 'Bedrooms', type: 'text' }, { id: 'baths', label: 'Bathrooms', type: 'text' }, { id: 'sqft', label: 'Square Footage', type: 'text' }] },
          { name: 'Mobile/Trailer Homes', filters: [{ id: 'beds', label: 'Bedrooms', type: 'text' }, { id: 'baths', label: 'Bathrooms', type: 'text' }, { id: 'size', label: 'Single/Double Wide', type: 'select', options: ['Single Wide', 'Double Wide', 'Triple Wide'] }] }
        ]
      },
      {
        name: 'Commercial & Land',
        types: [
          { name: 'Land & Lots', filters: [{ id: 'acres', label: 'Acres', type: 'text' }, { id: 'zoning', label: 'Zoning Type', type: 'text' }] },
          { name: 'Commercial Sales', filters: [{ id: 'sqft', label: 'Square Footage', type: 'text' }, { id: 'type', label: 'Property Type', type: 'text' }] },
          { name: 'Commercial Rentals', filters: [{ id: 'sqft', label: 'Square Footage', type: 'text' }, { id: 'type', label: 'Property Type', type: 'text' }] }
        ]
      }
    ]
  },
  {
    name: 'Apparel (Fashion)',
    subcategories: [
      {
        name: 'Menswear',
        types: [
          { name: 'Shirts & Tops', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Pants & Bottoms', filters: [{ id: 'size', label: 'Waist/Length', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Shoes', filters: [{ id: 'size', label: 'Shoe Size', type: 'select', options: COMMON_SHOE_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Steel Toe Shoes/Boots', filters: [{ id: 'size', label: 'Shoe Size', type: 'select', options: COMMON_SHOE_SIZES }, { id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Outerwear', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Womenswear',
        types: [
          { name: 'Shirts & Tops', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Pants & Bottoms', filters: [{ id: 'size', label: 'Size (Number/Letter)', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Shoes', filters: [{ id: 'size', label: 'Shoe Size', type: 'select', options: COMMON_SHOE_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Steel Toe Shoes/Boots', filters: [{ id: 'size', label: 'Shoe Size', type: 'select', options: COMMON_SHOE_SIZES }, { id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Dresses', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Kidswear & Baby',
        types: [
          { name: 'Clothing', filters: [{ id: 'size', label: 'Size/Age', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Shoes', filters: [{ id: 'size', label: 'Size', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Jewelry & Watches',
        types: [
          { name: 'Watches', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Jewelry', filters: [{ id: 'material', label: 'Material (Gold, Silver, etc)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Bags & Luggage',
        types: [
          { name: 'Purses & Handbags', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Luggage & Suitcases', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Backpacks', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Uniforms & Workwear',
        types: [
          { name: 'Suits', filters: [{ id: 'piece', label: 'Piece', type: 'select', options: SUIT_PIECES }, { id: 'size', label: 'Size', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Scrubs', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Fire Repellent (FRC)', filters: [{ id: 'type', label: 'Type (Shirt, Pants, Coverall)', type: 'text' }, { id: 'size', label: 'Size', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Electronics',
    subcategories: [
      {
        name: 'Cell Phones',
        types: [
          { name: 'Smartphones', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'model', label: 'Model', type: 'text' }, { id: 'carrier', label: 'Carrier / Unlocked', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Accessories', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Computers & Tablets',
        types: [
          { name: 'Laptops', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'specs', label: 'Processor/RAM', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Desktops', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'specs', label: 'Processor/RAM', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Tablets', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'storage', label: 'Storage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Parts & Components', filters: [{ id: 'type', label: 'Component Type', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'TV & Video',
        types: [
          { name: 'Televisions', filters: [{ id: 'size', label: 'Screen Size', type: 'text' }, { id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Home Audio / Soundbars', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Video Games & Consoles',
        types: [
          { name: 'Consoles', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Video Games', filters: [{ id: 'platform', label: 'Platform', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Controllers & Accessories', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Entertainment',
    subcategories: [
      {
        name: 'Books',
        types: [
          { name: 'Fiction', filters: [{ id: 'author', label: 'Author', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Non-Fiction', filters: [{ id: 'author', label: 'Author', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Textbooks', filters: [{ id: 'subject', label: 'Subject', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Movies & Music',
        types: [
          { name: 'DVDs & Blu-Rays', filters: [{ id: 'genre', label: 'Genre', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Vinyl Records', filters: [{ id: 'genre', label: 'Genre', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'CDs', filters: [{ id: 'genre', label: 'Genre', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Collectibles',
        types: [
          { name: 'Trading Cards', filters: [{ id: 'type', label: 'Type (Pokemon, Baseball, etc)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Action Figures', filters: [{ id: 'brand', label: 'Brand/Franchise', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Antiques', filters: [{ id: 'era', label: 'Era/Year', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Family',
    subcategories: [
      {
        name: 'Baby & Kids',
        types: [
          { name: 'Strollers & Car Seats', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Nursery Furniture', filters: [{ id: 'type', label: 'Type (Crib, Dresser)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Baby Gear', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Toys & Games',
        types: [
          { name: 'Action Figures', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Board Games', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Building Sets (LEGO, etc)', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Health & Beauty',
        types: [
          { name: 'Skincare', filters: [{ id: 'brand', label: 'Brand', type: 'text' }] },
          { name: 'Makeup', filters: [{ id: 'brand', label: 'Brand', type: 'text' }] },
          { name: 'Fragrances', filters: [{ id: 'brand', label: 'Brand', type: 'text' }] }
        ]
      },
      {
        name: 'Pet Supplies',
        types: [
          { name: 'Dog Supplies', filters: [{ id: 'type', label: 'Type (Food, Toys, Beds)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Cat Supplies', filters: [{ id: 'type', label: 'Type (Food, Toys, Beds)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Other Pet Supplies', filters: [{ id: 'animal', label: 'Animal Type', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Home Goods',
    subcategories: [
      {
        name: 'Furniture',
        types: [
          { name: 'Living Room', filters: [{ id: 'material', label: 'Material', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Bedroom', filters: [{ id: 'size', label: 'Bed Size', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Dining Room', filters: [{ id: 'seats', label: 'Number of Seats', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Office', filters: [{ id: 'type', label: 'Type (Desk, Chair)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Home Decor',
        types: [
          { name: 'Wall Art', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Rugs', filters: [{ id: 'size', label: 'Dimensions', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Lighting', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Kitchen & Dining',
        types: [
          { name: 'Cookware', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Tableware', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Small Appliances', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'type', label: 'Type (Coffee Maker, Blender)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Appliances',
        types: [
          { name: 'Refrigerators', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Washers & Dryers', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Ovens & Ranges', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Home Improvement Supplies',
    subcategories: [
      {
        name: 'Power Tools',
        types: [
          { name: 'Drills & Drivers', filters: [{ id: 'brand', label: 'Brand (DeWalt, Hercules, etc)', type: 'text' }, { id: 'power', label: 'Power Source', type: 'select', options: TOOL_POWER_SOURCES }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Saws', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'power', label: 'Power Source', type: 'select', options: TOOL_POWER_SOURCES }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Grinders & Sanders', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'power', label: 'Power Source', type: 'select', options: TOOL_POWER_SOURCES }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Air Compressors', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'capacity', label: 'Gallon Capacity', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Hand Tools',
        types: [
          { name: 'Wrenches & Sockets', filters: [{ id: 'brand', label: 'Brand (Icon, Pittsburgh, etc)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Pliers & Cutters', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Screwdrivers', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Hammers & Mallets', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Tool Storage',
        types: [
          { name: 'Tool Chests & Cabinets', filters: [{ id: 'brand', label: 'Brand (US General, Yukon, etc)', type: 'text' }, { id: 'size', label: 'Size (Inches)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Tool Bags & Belts', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Automotive Tools',
        types: [
          { name: 'Jacks & Stands', filters: [{ id: 'brand', label: 'Brand (Daytona, Pittsburgh, etc)', type: 'text' }, { id: 'capacity', label: 'Weight Capacity', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Diagnostic Tools', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Creepers & Shop Seating', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Welding & Soldering',
        types: [
          { name: 'Welders', filters: [{ id: 'brand', label: 'Brand (Titanium, Vulcan, etc)', type: 'text' }, { id: 'type', label: 'Type (MIG, TIG, Stick)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Welding Accessories', filters: [{ id: 'type', label: 'Type (Helmets, Gloves)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Generators & Engines',
        types: [
          { name: 'Generators', filters: [{ id: 'brand', label: 'Brand (Predator, etc)', type: 'text' }, { id: 'watts', label: 'Wattage', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Small Engines', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'cc', label: 'Engine CC', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Building Materials',
        types: [
          { name: 'Lumber', filters: [{ id: 'type', label: 'Wood Type', type: 'text' }] },
          { name: 'Paint & Supplies', filters: [{ id: 'brand', label: 'Brand', type: 'text' }] },
          { name: 'Flooring', filters: [{ id: 'type', label: 'Material (Wood, Tile, Vinyl)', type: 'text' }] }
        ]
      },
      {
        name: 'Hardware',
        types: [
          { name: 'Fasteners', filters: [{ id: 'type', label: 'Type', type: 'text' }] },
          { name: 'Door & Window Hardware', filters: [{ id: 'type', label: 'Type', type: 'text' }] }
        ]
      },
      {
        name: 'Heating & Cooling',
        types: [
          { name: 'Air Conditioners', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'type', label: 'Type (Window, Portable)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Heaters', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Fans', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Garden & Outdoor',
    subcategories: [
      {
        name: 'Patio Furniture',
        types: [
          { name: 'Seating & Sofas', filters: [{ id: 'material', label: 'Material', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Dining Sets', filters: [{ id: 'seats', label: 'Number of Seats', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Lawn Mowers & Tractors',
        types: [
          { name: 'Push Mowers', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'power', label: 'Power Source', type: 'select', options: TOOL_POWER_SOURCES }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Riding Mowers', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Zero Turn Mowers', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Plants & Gardening',
        types: [
          { name: 'Plants & Trees', filters: [{ id: 'type', label: 'Type (Indoor, Outdoor, Fruit)', type: 'text' }] },
          { name: 'Gardening Tools', filters: [{ id: 'type', label: 'Type (Shovels, Rakes, etc)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Pots & Planters', filters: [{ id: 'material', label: 'Material', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Sporting Goods',
    subcategories: [
      {
        name: 'Hunting & Fishing',
        types: [
          { name: 'Deer Stands & Blinds', filters: [{ id: 'type', label: 'Type (Tripod, Box, Tree, Ground)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Fishing Gear', filters: [{ id: 'type', label: 'Type (Rods, Reels, Tackle, Nets)', type: 'text' }, { id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Hunting Accessories', filters: [{ id: 'type', label: 'Type (Game Cameras, Calls, Decoys)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Optics & Scopes', filters: [{ id: 'type', label: 'Type (Scopes, Binoculars, Rangefinders)', type: 'text' }, { id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Camping & Survival', filters: [{ id: 'type', label: 'Type (Tents, Coolers, Lights)', type: 'text' }, { id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Exercise & Fitness',
        types: [
          { name: 'Cardio Equipment', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'type', label: 'Type (Treadmill, Bike)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Weights & Strength', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Outdoor Gear',
        types: [
          { name: 'Hiking & Backpacking', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'type', label: 'Type (Backpacks, Boots)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Water Sports', filters: [{ id: 'type', label: 'Type (Paddleboards, Tubes)', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Bicycles',
        types: [
          { name: 'Mountain Bikes', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'size', label: 'Frame Size', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Road Bikes', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'size', label: 'Frame Size', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'BMX', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Team Sports',
        types: [
          { name: 'Baseball & Softball', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Basketball', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Football', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Classifieds & Free Stuff',
    subcategories: [
      {
        name: 'Community',
        types: [
          { name: 'Garage Sales', filters: [{ id: 'date', label: 'Dates of Sale', type: 'text' }] },
          { name: 'Lost & Found', filters: [{ id: 'type', label: 'Lost or Found?', type: 'select', options: ['Lost', 'Found'] }, { id: 'date', label: 'Date Lost/Found', type: 'text' }] }
        ]
      },
      {
        name: 'Free & Misc',
        types: [
          { name: 'Free Stuff', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Miscellaneous Items', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  }
];
