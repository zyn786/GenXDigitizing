-- Phase A.2 -- Expand WorkflowOrderStatus with two new values

ALTER TYPE "WorkflowOrderStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "WorkflowOrderStatus" ADD VALUE 'ASSIGNED_TO_DESIGNER';
