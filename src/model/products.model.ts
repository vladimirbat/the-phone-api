export interface Product {
  id: string;
  imgUrl: string;
  brand: string;
  model: string;
  price: PriceOption[] | string;
  cpu: string;
  ram: string;
  so: string;
  displayResolution: string;
  battery: string;
  dimentions: string;
  weight: string;
  primaryCamera: string[] | string;
  secondaryCamera: string;
  options: ColorAndStorageOptions | string;
}

export interface ColorAndStorageOptions {
  colors: DeviceVariantOption[];
  storage: DeviceVariantOption[];
}

export interface PriceOption {
  color: DeviceVariantOption;
  storage: DeviceVariantOption;
  price: number;
}

export interface DeviceVariantOption {
  code: string;
  name: string;
}
