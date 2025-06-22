-- CreateTable
CREATE TABLE "operation_sessions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "userGoal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui_state_transitions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromUIStateId" TEXT,
    "toUIStateId" TEXT NOT NULL,
    "triggerAction" JSONB NOT NULL,
    "beforeState" JSONB NOT NULL,
    "afterState" JSONB NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_state_transitions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "operation_sessions" ADD CONSTRAINT "operation_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "operation_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_fromUIStateId_fkey" FOREIGN KEY ("fromUIStateId") REFERENCES "ui_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_toUIStateId_fkey" FOREIGN KEY ("toUIStateId") REFERENCES "ui_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
