This repository contains the backend service for the Reporting Module of the Q-MES (Manufacturing Execution System).
Its primary function is to extract data from the main production database twice daily—at 9:15 AM and 10:00 PM—and store it in a dedicated reporting database hosted on a separate server.

The main objective of this system is to reduce the performance load on the production database during report generation.
In the production environment, users often generate reports multiple times a day, which can create significant strain on the main database and slow down its operations.
By transferring relevant data to a separate reporting database, this service ensures faster report generation while maintaining the stability of the core production system.

In addition to automated data pulls, the system also supports manual data extraction and manual data deletion, allowing administrators to address issues such as incorrect reports or failures that may occur during the scheduled data pull process.
