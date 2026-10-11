/**
 * OAuth 2.0 metadata for the MCP connector (Streamable HTTP).
 *
 * Clients discover these via the `WWW-Authenticate` header on a 401 from
 * /api/mcp, or by fetching:
 *   GET /.well-known/oauth-protected-resource[/api/mcp]
 *   GET /.well-known/oauth-authorization-server
 *
 * Users authorize by signing in to Manpower and approving the connection on
 * /mcp/authorize — no API key needed, so MCP works on every plan.
 */

export const MCP_ORIGIN = "https://app.manpower.app";
export const MCP_RESOURCE = `${MCP_ORIGIN}/api/mcp`;

/** RFC 9728 — Protected Resource Metadata. */
export function protectedResourceMetadata() {
  return {
    resource: MCP_RESOURCE,
    authorization_servers: [MCP_ORIGIN],
    bearer_methods_supported: ["header"],
    scopes_supported: ["read", "write"],
  };
}

/** RFC 8414 — Authorization Server Metadata. */
export function authorizationServerMetadata() {
  return {
    issuer: MCP_ORIGIN,
    authorization_endpoint: `${MCP_ORIGIN}/api/mcp/oauth/authorize`,
    token_endpoint: `${MCP_ORIGIN}/api/mcp/oauth/token`,
    registration_endpoint: `${MCP_ORIGIN}/api/mcp/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["read", "write"],
    service_documentation: `${MCP_ORIGIN}/settings/api/docs`,
  };
}
