-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "province" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "pec" TEXT,
    "contractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Basin" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "flowType" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Basin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "province" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "notes" TEXT,
    "entityType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contributor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vatNumber" TEXT,
    "fiscalCode" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "province" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "basinId" TEXT,
    "authorizedMaterialTypes" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "cerCode" TEXT,
    "reference" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "usageContext" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "loadingDate" TIMESTAMP(3),
    "unloadingDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "logisticSenderId" TEXT,
    "logisticRecipientId" TEXT,
    "logisticTransporterId" TEXT,
    "clientId" TEXT,
    "basinId" TEXT NOT NULL,
    "flowType" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "materialType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DA_EVADERE',
    "expectedQuantity" DOUBLE PRECISION,
    "actualQuantity" DOUBLE PRECISION,
    "destinationQuantity" DOUBLE PRECISION,
    "loadedPackages" INTEGER,
    "departureWeight" DOUBLE PRECISION,
    "arrivalWeight" DOUBLE PRECISION,
    "assignedOperatorId" TEXT,
    "operatorAssignedAt" TIMESTAMP(3),
    "notes" TEXT,
    "documents" TEXT,
    "loadingPhotos" TEXT,
    "loadingVideos" TEXT,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "rejectionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "pickupOrderId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimatedDuration" INTEGER,
    "specialInstructions" TEXT,
    "equipmentNeeded" TEXT,
    "pickupLatitude" DOUBLE PRECISION,
    "pickupLongitude" DOUBLE PRECISION,
    "deliveryLatitude" DOUBLE PRECISION,
    "deliveryLongitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorActivity" (
    "id" TEXT NOT NULL,
    "pickupOrderId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT,
    "photos" TEXT,
    "videos" TEXT,
    "packageCount" INTEGER,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupOrderStatusHistory" (
    "id" TEXT NOT NULL,
    "pickupOrderId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "reason" TEXT,
    "notes" TEXT,

    CONSTRAINT "PickupOrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "contributorId" TEXT NOT NULL,
    "materialTypeId" TEXT NOT NULL,
    "basinId" TEXT,
    "clientId" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "documentNumber" TEXT,
    "vehiclePlate" TEXT,
    "driverName" TEXT,
    "quality" TEXT,
    "moistureLevel" TEXT,
    "contaminationLevel" TEXT,
    "documents" TEXT,
    "photos" TEXT,
    "notes" TEXT,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftNumber" INTEGER NOT NULL,
    "operatorId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ProcessingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingInput" (
    "id" TEXT NOT NULL,
    "processingSessionId" TEXT NOT NULL,
    "materialTypeId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "qualityGrade" TEXT,
    "moistureLevel" TEXT,
    "contaminationPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingOutput" (
    "id" TEXT NOT NULL,
    "processingSessionId" TEXT NOT NULL,
    "materialTypeId" TEXT NOT NULL,
    "quantityProduced" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "qualityGrade" TEXT NOT NULL DEFAULT 'GOOD',
    "packageCount" INTEGER NOT NULL DEFAULT 0,
    "packageType" TEXT,
    "storageLocation" TEXT,
    "batchNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingWaste" (
    "id" TEXT NOT NULL,
    "processingSessionId" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "disposalMethod" TEXT,
    "disposalDestination" TEXT,
    "cerCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingWaste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "materialType" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "materialTypeId" TEXT,
    "initialStock" DOUBLE PRECISION NOT NULL,
    "deliveries" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalStock" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerceologicalAnalysis" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "basinId" TEXT NOT NULL,
    "flowType" TEXT NOT NULL,
    "foreignFractionPercentage" DOUBLE PRECISION NOT NULL,
    "plasticPackagingPercentage" DOUBLE PRECISION NOT NULL,
    "cplPetPercentage" DOUBLE PRECISION NOT NULL,
    "otherCplPercentage" DOUBLE PRECISION NOT NULL,
    "trackersPercentage" DOUBLE PRECISION NOT NULL,
    "variousPackagingPercentage" DOUBLE PRECISION NOT NULL,
    "sampleWeight" DOUBLE PRECISION,
    "analysisMethod" TEXT,
    "operator" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerceologicalAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Processing" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "operatorId" TEXT,
    "inputMaterialType" TEXT NOT NULL,
    "inputWeight" DOUBLE PRECISION NOT NULL,
    "inputReference" TEXT NOT NULL,
    "efficiency" DOUBLE PRECISION,
    "wasteWeight" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingOutput_Old" (
    "id" TEXT NOT NULL,
    "processingId" TEXT NOT NULL,
    "outputMaterialType" TEXT NOT NULL,
    "outputWeight" DOUBLE PRECISION NOT NULL,
    "outputReference" TEXT NOT NULL,
    "quality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingOutput_Old_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_vatNumber_key" ON "Client"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Basin_code_key" ON "Basin"("code");

-- CreateIndex
CREATE INDEX "Contributor_name_idx" ON "Contributor"("name");

-- CreateIndex
CREATE INDEX "Contributor_basinId_idx" ON "Contributor"("basinId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialType_code_key" ON "MaterialType"("code");

-- CreateIndex
CREATE INDEX "MaterialType_code_idx" ON "MaterialType"("code");

-- CreateIndex
CREATE INDEX "MaterialType_parentId_idx" ON "MaterialType"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "PickupOrder_orderNumber_key" ON "PickupOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PickupOrder_status_idx" ON "PickupOrder"("status");

-- CreateIndex
CREATE INDEX "PickupOrder_scheduledDate_idx" ON "PickupOrder"("scheduledDate");

-- CreateIndex
CREATE INDEX "PickupOrder_basinId_idx" ON "PickupOrder"("basinId");

-- CreateIndex
CREATE INDEX "PickupOrder_assignedOperatorId_idx" ON "PickupOrder"("assignedOperatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_pickupOrderId_key" ON "Shipment"("pickupOrderId");

-- CreateIndex
CREATE INDEX "Delivery_date_idx" ON "Delivery"("date");

-- CreateIndex
CREATE INDEX "Delivery_contributorId_idx" ON "Delivery"("contributorId");

-- CreateIndex
CREATE INDEX "Delivery_materialTypeId_idx" ON "Delivery"("materialTypeId");

-- CreateIndex
CREATE INDEX "Delivery_basinId_idx" ON "Delivery"("basinId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_date_contributorId_materialTypeId_key" ON "Delivery"("date", "contributorId", "materialTypeId");

-- CreateIndex
CREATE INDEX "ProcessingSession_date_idx" ON "ProcessingSession"("date");

-- CreateIndex
CREATE INDEX "ProcessingSession_operatorId_idx" ON "ProcessingSession"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingSession_date_shiftNumber_key" ON "ProcessingSession"("date", "shiftNumber");

-- CreateIndex
CREATE INDEX "ProcessingInput_processingSessionId_idx" ON "ProcessingInput"("processingSessionId");

-- CreateIndex
CREATE INDEX "ProcessingInput_materialTypeId_idx" ON "ProcessingInput"("materialTypeId");

-- CreateIndex
CREATE INDEX "ProcessingOutput_processingSessionId_idx" ON "ProcessingOutput"("processingSessionId");

-- CreateIndex
CREATE INDEX "ProcessingOutput_materialTypeId_idx" ON "ProcessingOutput"("materialTypeId");

-- CreateIndex
CREATE INDEX "ProcessingWaste_processingSessionId_idx" ON "ProcessingWaste"("processingSessionId");

-- CreateIndex
CREATE INDEX "ProcessingWaste_wasteTypeId_idx" ON "ProcessingWaste"("wasteTypeId");

-- CreateIndex
CREATE INDEX "Inventory_date_idx" ON "Inventory"("date");

-- CreateIndex
CREATE INDEX "Inventory_materialType_reference_idx" ON "Inventory"("materialType", "reference");

-- CreateIndex
CREATE INDEX "Inventory_materialTypeId_idx" ON "Inventory"("materialTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_date_materialType_reference_materialTypeId_key" ON "Inventory"("date", "materialType", "reference", "materialTypeId");

-- CreateIndex
CREATE INDEX "MerceologicalAnalysis_date_idx" ON "MerceologicalAnalysis"("date");

-- CreateIndex
CREATE INDEX "MerceologicalAnalysis_basinId_flowType_idx" ON "MerceologicalAnalysis"("basinId", "flowType");

-- CreateIndex
CREATE INDEX "Processing_date_shift_idx" ON "Processing"("date", "shift");

-- CreateIndex
CREATE INDEX "Processing_operatorId_idx" ON "Processing"("operatorId");

-- AddForeignKey
ALTER TABLE "Basin" ADD CONSTRAINT "Basin_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_basinId_fkey" FOREIGN KEY ("basinId") REFERENCES "Basin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialType" ADD CONSTRAINT "MaterialType_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MaterialType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_logisticSenderId_fkey" FOREIGN KEY ("logisticSenderId") REFERENCES "LogisticEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_logisticRecipientId_fkey" FOREIGN KEY ("logisticRecipientId") REFERENCES "LogisticEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_logisticTransporterId_fkey" FOREIGN KEY ("logisticTransporterId") REFERENCES "LogisticEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_basinId_fkey" FOREIGN KEY ("basinId") REFERENCES "Basin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_pickupOrderId_fkey" FOREIGN KEY ("pickupOrderId") REFERENCES "PickupOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorActivity" ADD CONSTRAINT "OperatorActivity_pickupOrderId_fkey" FOREIGN KEY ("pickupOrderId") REFERENCES "PickupOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorActivity" ADD CONSTRAINT "OperatorActivity_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrderStatusHistory" ADD CONSTRAINT "PickupOrderStatusHistory_pickupOrderId_fkey" FOREIGN KEY ("pickupOrderId") REFERENCES "PickupOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Contributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "MaterialType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_basinId_fkey" FOREIGN KEY ("basinId") REFERENCES "Basin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingSession" ADD CONSTRAINT "ProcessingSession_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingInput" ADD CONSTRAINT "ProcessingInput_processingSessionId_fkey" FOREIGN KEY ("processingSessionId") REFERENCES "ProcessingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingInput" ADD CONSTRAINT "ProcessingInput_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "MaterialType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingOutput" ADD CONSTRAINT "ProcessingOutput_processingSessionId_fkey" FOREIGN KEY ("processingSessionId") REFERENCES "ProcessingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingOutput" ADD CONSTRAINT "ProcessingOutput_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "MaterialType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingWaste" ADD CONSTRAINT "ProcessingWaste_processingSessionId_fkey" FOREIGN KEY ("processingSessionId") REFERENCES "ProcessingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingWaste" ADD CONSTRAINT "ProcessingWaste_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "MaterialType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "MaterialType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerceologicalAnalysis" ADD CONSTRAINT "MerceologicalAnalysis_basinId_fkey" FOREIGN KEY ("basinId") REFERENCES "Basin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingOutput_Old" ADD CONSTRAINT "ProcessingOutput_Old_processingId_fkey" FOREIGN KEY ("processingId") REFERENCES "Processing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
