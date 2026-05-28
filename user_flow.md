# User Flow & Product Journey

The Hyper-Local Delivery Platform caters to four distinct personas: **Customers**, **Vendors**, **Delivery Riders**, and **Admins**. 

## Core Journey Map

```mermaid
flowchart TD
    %% Vendor Flow
    subgraph Vendor Journey
        V1[Vendor Opens App] --> V2[Scans Product Barcode]
        V2 --> V3[Enters Quantity & MRP]
        V3 --> V4[Submission Pending Approval]
    end

    %% Admin Flow
    subgraph Admin Journey
        A1[Admin Dashboard] --> A2[Reviews Vendor Intakes]
        A4[Monitors AI Forecasts] --> A5[Routes Excess Inventory]
        A2 -- Approves --> A3[Added to Master Catalog]
        A3 --> C3
    end

    %% Customer Flow
    subgraph Customer Journey
        C1[Customer Opens App] --> C2[Selects City & Apartment]
        C2 --> C3[Browses Available Products]
        C3 --> C4[Adds to Cart]
        C4 --> C5[Selects Delivery Time Slot]
        C5 --> C6[Completes Checkout]
    end

    %% Rider Flow
    subgraph Delivery Rider Journey
        R1[Rider Logs In] --> R2[Views Clustered Orders]
        R2 --> R3[Picks up Batched Orders]
        R3 --> R4[Delivers to Specific Apartment]
        R4 --> R5[Marks Orders as Delivered]
    end

    V4 -.-> A2
    C6 -.-> A1
    C6 -.-> R2
```

## Detailed Flow Breakdown

### 1. The Customer Journey
- **Onboarding:** The customer lands on the web app and is prompted to select their **City** and **Apartment Complex**. This hyper-localizes their view.
- **Shopping:** The customer browses categories (Groceries, Dairy, etc.) populated from the Master Catalog.
- **Checkout:** The customer adds items to their cart, selects a preferred **Time Slot** (Morning, Afternoon, or Evening), and completes the purchase.
- **Fulfillment:** Order status updates dynamically (Pending -> Packed -> Out for Delivery -> Delivered).

### 2. The Vendor Journey
- **Intake:** Local vendors use the app to scan a product's barcode using their device camera.
- **Stock Update:** They input the quantity and pricing details.
- **Sync:** The data is sent to the admin for approval. Once approved, it reflects in the Master Catalog immediately, making it available for customers to buy.

### 3. The Delivery Rider Journey
- **Dispatch:** Instead of picking up single orders, the rider sees orders batched by **Apartment Block** and **Time Slot**.
- **Delivery:** The rider travels to one location (e.g., "Prestige Apartments") and delivers 30-50 orders in a single trip.
- **Completion:** The rider updates the status for all delivered flats at once.

### 4. The Admin Journey
- **Oversight:** The Admin logs into a central dashboard (`/admin`) to monitor total revenue, pending orders, and registered customers.
- **Catalog Management:** The Admin approves vendor barcode scans and manages categories.
- **AI Forecasting:** The Admin views AI insights identifying demand spikes and inventory depletion risks, enabling dynamic supply rerouting.
