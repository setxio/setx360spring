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

const COMMON_CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair'];
const COMMON_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Other'];
const COMMON_SHOE_SIZES = ['6', '7', '8', '9', '10', '11', '12', '13', 'Other'];

export const CATEGORY_TAXONOMY: CategoryConfig[] = [
  {
    name: 'Apparel & Accessories',
    subcategories: [
      {
        name: 'Men',
        types: [
          { name: 'Shirts & Tops', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Pants & Bottoms', filters: [{ id: 'size', label: 'Waist/Length', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Shoes', filters: [{ id: 'size', label: 'Shoe Size', type: 'select', options: COMMON_SHOE_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Accessories', filters: [{ id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Women',
        types: [
          { name: 'Shirts & Tops', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Pants & Bottoms', filters: [{ id: 'size', label: 'Size (Number/Letter)', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Shoes', filters: [{ id: 'size', label: 'Shoe Size', type: 'select', options: COMMON_SHOE_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Dresses', filters: [{ id: 'size', label: 'Size', type: 'select', options: COMMON_APPAREL_SIZES }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Accessories', filters: [{ id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Children',
        types: [
          { name: 'Shirts & Tops', filters: [{ id: 'size', label: 'Size', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Pants & Bottoms', filters: [{ id: 'size', label: 'Size', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Shoes', filters: [{ id: 'size', label: 'Shoe Size', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Other', filters: [{ id: 'size', label: 'Size', type: 'text' }, { id: 'color', label: 'Color', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Electronics & Tech',
    subcategories: [
      {
        name: 'Computers',
        types: [
          { name: 'Laptops', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Desktops', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Accessories', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Phones & Tablets',
        types: [
          { name: 'Smartphones', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Tablets', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Gaming',
        types: [
          { name: 'Consoles', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Video Games', filters: [{ id: 'brand', label: 'Platform', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Home & Garden',
    subcategories: [
      {
        name: 'Furniture',
        types: [
          { name: 'Living Room', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Bedroom', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Office', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Other', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Appliances',
        types: [
          { name: 'Large Appliances', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Small Appliances', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Garden & Outdoor',
        types: [
          { name: 'Tools', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Patio Furniture', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Plants & Supplies', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'Hobbies & Entertainment',
    subcategories: [
      {
        name: 'Sporting Goods',
        types: [
          { name: 'Golf', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Fitness', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Other Sports', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      },
      {
        name: 'Musical Instruments',
        types: [
          { name: 'Guitars', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Keyboards & Pianos', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Drums', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] },
          { name: 'Other', filters: [{ id: 'brand', label: 'Brand', type: 'text' }, { id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  },
  {
    name: 'General / Other',
    subcategories: [
      {
        name: 'Other',
        types: [
          { name: 'Other', filters: [{ id: 'condition', label: 'Condition', type: 'select', options: COMMON_CONDITIONS }] }
        ]
      }
    ]
  }
];
