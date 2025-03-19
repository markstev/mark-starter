"use client";

import type { AppRouter } from '../../../api/src/index';
import { createTRPCContext } from '@trpc/tanstack-react-query';
 
export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();