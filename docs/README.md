# Cyclefy Backend Documentation

Cyclefy is a backend learning project for item reuse: donation, barter, borrowing, recycling, and repair. These documents explain how the checked-in code works, including its incomplete parts.

Return to the [project README](../README.md) for the portfolio overview and local setup summary.

## Reading guide

| Goal | Read |
| --- | --- |
| Understand the structure and request pipeline | [Architecture](architecture.md) |
| Understand the data model | [Database](database.md) |
| Follow a feature across routes, services, and tables | [Business workflows](workflows.md) |
| Find endpoints and request/response conventions | [API guide](api.md) |
| Configure, run, seed, or test the project | [Development guide](development.md) |
| Review defects and future improvement priorities | [Known limitations](known-limitations.md) |
| Read the personal portfolio story behind the implementation | [Work behind the work](work-behind-the-work.md) |
| Browse detailed request and response examples | [OpenAPI specification](openapi.yaml) |

For a first review, read architecture, database, workflows, and known limitations in that order.

## Scope and evidence

This documentation was prepared from a source review of the application, helpers, validation, middleware, Prisma models and migrations, seeders, tests, environment template, package files, translations, and OpenAPI specification.

The reviewed snapshot contains 72 registered API routes, 36 Prisma models, three SQL migrations, and 61 tests in 15 test files. Static syntax checks passed for 110 JavaScript files. Model/table scalar-column names and enum values matched in a static comparison.

These checks do not prove runtime correctness. The review did not start the application, execute the test suite, connect to a database, or verify external accounts. Dependencies and the generated Prisma client were absent from the reviewed workspace.

## How to interpret the documents

- **Current behavior** describes code that exists, including defects that affect the result.
- **Missing functionality** describes behavior for which no implementation was found in this repository.
- **Proposed improvements** are future work, not features or fixes already delivered.
- **Unverified concerns** need a configured runtime, external account, or product decision.

Source files are linked throughout. When the existing OpenAPI file and implementation differ, the API guide records the difference rather than silently treating the specification as accurate. This documentation update does not change application behavior or the OpenAPI file.

The learning context is explained in the main README. The limitations register keeps the technical details visible without repeating the full list in every guide.

The portfolio story is written as a standalone article in first person. It describes the implementation and lessons without claiming a production launch, measured user impact, or completed fixes. It uses ordinary Markdown rather than assuming a particular blog engine or publishing format.
