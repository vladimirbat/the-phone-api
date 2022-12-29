import { Product } from "./products.model";

export interface SearchPhonesResponse {
  total:number;
  page:number;
  pageSize: number;
  products: Product[];
}