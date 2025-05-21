-- CreateTable
CREATE TABLE "PickupOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "shipperId" TEXT,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "basinId" TEXT NOT NULL,
    "flowType" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expectedQuantity" DOUBLE PRECISION,
    "actualQuantity" DOUBLE PRECISION,
    "destinationQuantity" DOUBLE PRECISION,
    "notes" TEXT,
    "documents" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickupOrder_orderNumber_key" ON "PickupOrder"("orderNumber");

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupOrder" ADD CONSTRAINT "PickupOrder_basinId_fkey" FOREIGN KEY ("basinId") REFERENCES "Basin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
