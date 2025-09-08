// Compatibility shim: re-export the TypeScript implementation so any JS imports get the full API.
export * from './engagementApi.ts'
import tsApi from './engagementApi.ts'
export const engagementApi = tsApi
export default tsApi
