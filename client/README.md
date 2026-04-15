# Client

## Running the Dev Server

This project uses [Moon](https://moonrepo.dev/) as a monorepo task runner. From the repository root:

```bash
moon run client:dev # (meant to be runned locally with nix)
```

This starts the Vite dev server with hot-module replacement.

## Tecnologies
- shadcn : components library
- zod & react-form: form validation
- tanstack-query: fetching functionality with caching
- tanstack-table: table component