/**
 * The SAM type of the `SqlConnection` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - SqlConnection Model
 */
export interface SAMSqlConnection {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMConnectionCommonMetadata;
  spec: SAMSqlConnectionSpec;
  /**
   * SqlConnection.status[obj]: Optional, Read-only. Stateful status information about the SqlConnection.
   */
  status?: SAMConnectionCommonStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * SqlConnection.metadata[obj]: Required, the SqlConnection metadata.
 */
export interface SAMConnectionCommonMetadata {
  /**
   * The manifest annotations. Used for storing arbitrary metadata as
   *             key-value pairs. Example: [{'smarter.sh/test-manifest/project-name': 'Scooby dooby do'}]. The
   *             key should be a valid url-friendly string. The value accepts
   *             multi-line string values (YAML block scalars) and various scalar types including
   *             str, int, float, bool, datetime.date, datetime.datetime, decimal.Decimal, uuid.UUID, bytes, list, dict.
   *
   */
  annotations?:
    | {
        [k: string]:
          | string
          | number
          | boolean
          | unknown[]
          | {
              [k: string]: unknown | undefined;
            }
          | undefined;
      }[]
    | null;
  /**
   * The description for this resource. Be brief. Keep it under 255 characters.
   */
  description: string | null;
  /**
   * The camelCase name of the manifest resource
   */
  name: string;
  /**
   * The tags of the manifest. Used for generic resource categorization and search. Example: ['tag1', 'tag2']
   */
  tags?: string[] | null;
  /**
   * The semantic version of the manifest. Example: 0.1.0
   */
  version: string | null;
  [k: string]: unknown | undefined;
}
/**
 * SqlConnection.spec[obj]: Required, the SqlConnection specification.
 */
export interface SAMSqlConnectionSpec {
  connection: Connection;
  [k: string]: unknown | undefined;
}
/**
 * SqlConnection.spec.selector[obj]: the selector logic to use for the SqlConnection
 */
export interface Connection {
  /**
   * The authentication method to use for the connection. Example: 'Standard TCP/IP', 'Standard TCP/IP over SSH', 'LDAP User/Password'.
   */
  authenticationMethod?: string;
  /**
   * The name of the database to connect to. Examples: 'sales' or 'mydb'.
   */
  database: string;
  /**
   * A valid SQL database engine. Common db_engines: ['django.db.backends.postgresql', 'django.db.backends.mysql', 'django.db.backends.oracle', 'django.db.backends.sqlite3', 'django.db.backends.mssql', 'django.db.backends.sybase']
   */
  dbEngine: string;
  /**
   * The remote host of the SQL connection. Should be a valid internet domain name. Example: 'localhost' or 'mysql.mycompany.com'.
   */
  hostname: string;
  /**
   * The maximum number of connections to allow beyond the pool size.
   */
  maxOverflow?: number;
  /**
   * The password.
   */
  password?: string | null;
  /**
   * The size of the connection pool.
   */
  poolSize?: number;
  /**
   * The port of the SQL connection. Default values are assigned based on the dbEngine.
   */
  port?: number | null;
  /**
   * The remote host of the SQL proxy connection. Should be a valid internet domain name.
   */
  proxyHost?: string | null;
  /**
   * The password for the proxy connection.
   */
  proxyPassword?: string | null;
  /**
   * The port of the SQL proxy connection.
   */
  proxyPort?: number | null;
  /**
   * The username for the proxy connection.
   */
  proxyUsername?: string | null;
  /**
   * The known_hosts file content for verifying SSH connections.
   */
  sshKnownHosts?: string | null;
  /**
   * The Certificate Authority (CA) certificate for verifying the server.
   */
  sslCa?: string | null;
  /**
   * The SSL certificate for the connection, if required.
   */
  sslCert?: string | null;
  /**
   * The SSL key for the connection, if required.
   */
  sslKey?: string | null;
  /**
   * The timeout for the database connection in seconds. Default is 30 seconds.
   */
  timeout?: number;
  /**
   * Whether to use SSL/TLS for the connection.
   */
  useSsl?: boolean;
  /**
   * The database username.
   */
  username?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Connection Manifest - Status class.
 */
export interface SAMConnectionCommonStatus {
  /**
   * Connection.status.account_number: The account owner of this Connection. Read only.
   */
  account_number: string;
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * Connection.status.username: The Smarter user who created this Connection. Read only.
   */
  username: string;
  [k: string]: unknown | undefined;
}
/**
 * A resource that depends on the resource that a manifest describes.
 */
export interface SAMDependency {
  /**
   * kind[String]: The SAM kind of the resource that depends on this resource, e.g. LLMClient. Read only.
   */
  kind: string;
  /**
   * name[String]: The name of the resource that depends on this resource. Read only.
   */
  name: string;
  [k: string]: unknown | undefined;
}
