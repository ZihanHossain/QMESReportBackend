# Q-MES Reporting Module Backend

## Overview
This repository contains the **backend service** for the Reporting Module of the **Q-MES (Manufacturing Execution System)**.  

Its primary function is to **extract data from the main production database twice daily**—at **9:15 AM** and **10:00 PM**—and store it in a dedicated reporting database hosted on a separate server.

---

## Purpose
The main objective of this system is to **reduce performance load** on the production database during report generation.  
In a live production environment, users often generate reports multiple times a day, creating significant strain on the main database and slowing down operations.  

By transferring relevant data to a separate reporting database, this service ensures:
- Faster report generation  
- Stable performance of the core production system

---

## Key Features
- **Automated Data Pull** at 9:15 AM and 10:00 PM
- **Manual Data Extraction** for on-demand updates
- **Manual Data Deletion** to correct errors or remove invalid data
- Maintains **data integrity** and **system stability** during heavy reporting activity

---

## Data Flow Diagram

```mermaid
flowchart TD
    A[Q-MES Production Database] -->|Direct DB Connection| B[Backend Service]
    B -->|Run Report-Specific Queries| C[Transform & Prepare Data]
    C -->|Insert into Tables| D[Reporting Database - Separate Server]
    D --> E[SSRS Reports]
    E -->|User Views Reports| F[Accurate Data Display]

    %% Scheduled Automation
    subgraph Schedule
        B1[Automated Data Pull at 9:15 AM & 10:00 PM]
        B1 --> B
    end

    %% Admin Actions
    subgraph Admin
        G[Manual Data Deletion / Correction] --> B
    end

    %% Error Handling
    B -- Pull Failure --> H[Error Logged & Notified Admin]
    H --> G

    %% Extra Data Upload
    I[Extra Info Uploaded Before 9:15 AM] --> C

