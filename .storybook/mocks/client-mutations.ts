import { mockClient, mockClient2 } from "./index";

export async function listClientsAction() {
  return {
    ok: true,
    clients: [mockClient, mockClient2],
  };
}

export async function createClient() {
  return {
    ok: true,
    client: mockClient,
  };
}

export async function updateClient() {
  return {
    ok: true,
    client: mockClient,
  };
}

export async function deleteClient() {
  return { ok: true };
}

export async function deleteClientWithAllData() {
  return { ok: true };
}
