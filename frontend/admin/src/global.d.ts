// Allow importing .jsx and other JS modules without type declarations
declare module '*.jsx' {
  const Component: any;
  export default Component;
}

declare module '*.js' {
  const Component: any;
  export default Component;
}

// Generic module fallback
declare module '*';
