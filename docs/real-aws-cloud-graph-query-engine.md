# Real AWS Cloud Graph Query Engine

## 1. Overview
The **CLOUDPULSE Cloud Graph Query Engine** provides a secure, declarative, provider-neutral AST query interface over the Phase 58 Governance Knowledge Graph.

Instead of running unvetted shell commands, raw SQL, or ad-hoc graph scripts against cloud environments, the engine evaluates structured queries using bounded tree traversal, safe predicate filters, and multi-hop relationship joins with complete evidence provenance.

---

## 2. Query Engine Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             INVESTIGATION UI                             │
│       Natural Language Bar  │  Visual AST Builder  │  Query History      │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ (AST Payload)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     AWS CLOUD QUERY ENGINE (BACKEND)                     │
│                                                                          │
│  1. AST Validation Guard (Depth <= 5, Limit <= 100, Safe Operators)     │
│  2. Query Optimizer & Explain Plan Generator                             │
│     ├── INDEX_SCAN (Candidate entity identification)                     │
│     ├── FILTER_APPLY (Field predicate evaluation)                        │
│     ├── RELATIONSHIP_JOIN (Multi-hop edge constraint traversal)          │
│     └── EVIDENCE_AGGREGATION (Telemetry & provenance synthesis)          │
│  3. Graph Traversal Engine (In-Memory Fast Graph Index)                  │
│  4. Tenant Isolation & Scope Verification                                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   PHASE 58 GOVERNANCE KNOWLEDGE GRAPH                    │
│   Resources │ IAM │ Security │ Drift │ Telemetry │ Costs │ Incidents    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Abstract Syntax Tree (AST) Specification

The engine operates on a strongly-typed, schema-validated AST (`CloudQueryAst`):

```typescript
export interface CloudQueryAst {
  primaryEntityType: CloudKnowledgeNodeType | 'ANY';
  filters?: CloudQueryFilter[];
  relationships?: CloudQueryRelationshipConstraint[];
  timeRange?: string;
  limit?: number;
  maxTraversalDepth?: number;
}

export interface CloudQueryFilter {
  field: string;
  operator: CloudQueryOperator; // 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'GREATER_THAN' | 'LESS_THAN' | 'IN'
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface CloudQueryRelationshipConstraint {
  relationshipType: CloudKnowledgeRelationshipType;
  targetNodeType?: CloudKnowledgeNodeType | 'ANY';
  depthLimit?: number;
  targetFilter?: CloudQueryFilter[];
}
```

---

## 4. Query Safety & Bounds Enforcement

To prevent resource exhaustion, malicious code execution, and cross-tenant data leaks, the engine enforces strict runtime bounds:

1. **Max Traversal Depth**: Capped at `5` hops to prevent recursive loop denial-of-service.
2. **Result Limit**: Capped at `100` nodes per execution.
3. **Operator Allowlist**: Only declarative comparison operators (`EQUALS`, `NOT_EQUALS`, `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`, `GREATER_THAN`, `LESS_THAN`, `GREATER_EQUAL`, `LESS_EQUAL`, `IN`) are permitted.
4. **Tenant Guard**: All node and edge lookups are filtered by workspace ID. Non-authorized workspaces receive `PERMISSION_REQUIRED` coverage status with zero entity leakage.
5. **No Mutation**: The query engine is strictly analytical and read-only. Real AWS mutations remain strictly governed by Phase 54 controlled execution guardrails.

---

## 5. Transparent Explain Plan

Every executed query or dry-run explain request returns an ordered set of execution steps with estimated record counts and complexity metrics:

```json
{
  "steps": [
    {
      "order": 1,
      "operation": "INDEX_SCAN",
      "description": "Scan Knowledge Graph for primary entity type 'RESOURCE' (36 candidate nodes).",
      "estimatedComplexity": "O(N)"
    },
    {
      "order": 2,
      "operation": "FILTER_APPLY",
      "description": "Apply 1 predicate filters (criticality EQUALS \"CRITICAL\").",
      "estimatedComplexity": "O(K)"
    },
    {
      "order": 3,
      "operation": "RELATIONSHIP_JOIN",
      "description": "Traverse edges with relationship constraint(s): VIOLATES (depth limit: 2).",
      "estimatedComplexity": "O(E)"
    },
    {
      "order": 4,
      "operation": "EVIDENCE_AGGREGATION",
      "description": "Aggregate confirmed/derived evidence provenance and calculate composite confidence.",
      "estimatedComplexity": "O(R)"
    }
  ],
  "recordsExamined": 36,
  "recordsReturned": 2,
  "estimatedExecutionCost": "LOW_RESOURCE_IMPACT (< 10ms)"
}
```

---

## 6. Real AWS API Endpoints

- `POST /api/v1/cloud-connections/aws/query/execute`: Executes a structured or natural language AST query against the connected AWS estate.
- `POST /api/v1/cloud-connections/aws/query/explain`: Returns the transparent Query Explain Plan without executing heavy joins.
- `GET /api/v1/cloud-connections/aws/query/history`: Retrieves the audit log of recent investigation queries.
- `GET /api/v1/cloud-connections/aws/query/suggestions`: Returns pre-built query templates across cloud operational domains.
