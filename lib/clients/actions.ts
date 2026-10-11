/**
 * Client data access. Prefer importing mutations from `./client-mutations` in
 * Client Components so the client bundle does not pull query + server modules.
 */
export type { ListClientsResult } from "./client-queries";
export { getClientById, listClients } from "./client-queries";

export type {
  CreateClientResult,
  DeleteClientResult,
  UpdateClientResult,
} from "./client-mutations";
export {
  createClient,
  deleteClient,
  listClientsAction,
  updateClient,
} from "./client-mutations";
