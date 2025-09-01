# Technical Architecture and Tech Stack for ProfitPath

## Architecture Overview  
- Desktop-first application with potential for web extension; initially lightweight local-first deployment.  
- Cross-platform compatibility (Windows, macOS, Linux) for client environments.  
- Modular design separating frontend UI, backend API, local database, and Electron shell.  
- Embedded database (SQLite) for reliable local data storage and offline access.  
- Electron framework for desktop application wrapper and native desktop features.  
- API Layer to handle business logic, inventory updates, purchase/sales transactions, and GST invoicing.  
- Secure local user authentication and role-based access control (RBAC).  
- Flexible reporting and export capabilities supporting accounting and compliance needs.

## Suggested Tech Stack  

| Layer                     | Technology/Tool                                | Justification                               |
|---------------------------|-----------------------------------------------|---------------------------------------------|
| Frontend                  | React (with Material-UI or Ant Design)       | Modern component-based UI with accessible design system |
| Backend                   | Node.js with Express                          | Lightweight, scalable API server for business logic |
| Database                  | SQLite                                        | Embedded, zero-configuration, supports complex queries and transactions |
| Desktop Wrapper           | Electron                                      | Cross-platform desktop application framework |
| ORM                       | Sequelize                                     | Simplifies database access and migrations |
| Authentication & Security | JWT/OAuth or local secured credential store  | Secure authentication and session management |
| Reporting                 | Chart.js / D3.js for charts, PDFKit for reports | Interactive reports and export functionality |
| Build & Packaging         | Electron Builder                              | Packaging app for Windows/macOS/Linux deployments |
| DevOps/CI                 | GitHub Actions or equivalent                   | Automated builds, testing, and deployment |

## Infrastructure  
- Fully client-side application with local database to avoid dependency on internet connectivity.  
- Optional future integration points for cloud sync or backups.  
- Local file system access for exporting reports and invoices securely.

## Non-Functional Requirements  
- High availability on user machines with minimal setup required.  
- Fast data access with efficient query handling.  
- Compliance with GST and accounting standards.  
- Scalable codebase to enable feature extensions and integrations.

## Excluded Components  
- Multi-currency and multi-warehouse support deferred to later phases.  
- Cloud-based database or server hosting excluded initially.

