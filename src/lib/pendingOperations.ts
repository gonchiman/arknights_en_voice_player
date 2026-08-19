import type { CloudOperation } from './stateMerge'

type QueueStorage = Pick<Storage, 'getItem' | 'setItem'>

function pendingOperationsKey(userId: string) {
  return `akvp.user.${userId}.pendingOperations`
}

export function readPendingOperations(
  storage: QueueStorage,
  userId: string,
): CloudOperation[] {
  try {
    const stored = storage.getItem(pendingOperationsKey(userId))
    return stored ? (JSON.parse(stored) as CloudOperation[]) : []
  } catch {
    return []
  }
}

export function writePendingOperations(
  storage: QueueStorage,
  userId: string,
  operations: CloudOperation[],
) {
  storage.setItem(pendingOperationsKey(userId), JSON.stringify(operations))
}

export function appendPendingOperation(
  storage: QueueStorage,
  userId: string,
  operation: CloudOperation,
) {
  writePendingOperations(storage, userId, [
    ...readPendingOperations(storage, userId),
    operation,
  ])
}

export async function flushPendingOperationsQueue(
  storage: QueueStorage,
  userId: string,
  apply: (operation: CloudOperation) => Promise<void>,
  shouldContinue: () => boolean = () => true,
) {
  while (shouldContinue()) {
    const operations = readPendingOperations(storage, userId)
    const operation = operations[0]
    if (!operation) return
    await apply(operation)
    const latestOperations = readPendingOperations(storage, userId)
    writePendingOperations(
      storage,
      userId,
      latestOperations.filter((item) => item.id !== operation.id),
    )
  }
}
