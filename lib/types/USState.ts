export type USState = {
  header?: string;
  abbr: string;
  name: string;
};

export type CategorizedUSState =
  | {
      header: string;
    }
  | {
      abbr: string;
      name: string;
    };
