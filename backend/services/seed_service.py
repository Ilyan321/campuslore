import logging
from typing import Dict, Any, List
from services.embedder_service import get_embeddings_batch
from services.supabase_service import insert_note_chunks, get_supabase_client
from utils.chunker import semantic_chunk

logger = logging.getLogger("campuslore.seed")

SEED_NOTES = [
    {
        "course_id": "CSE-212",
        "week_number": 5,
        "topic": "Queue Data Structure & Circular Implementations",
        "file_name": "circular_queue_lab.cpp",
        "content": (
            "QUEST Nawabshah CSE-212 DSA Lab #5: Circular Queue Implementation in C++\n"
            "Key Concept: In a standard linear array queue, once rear reaches MAX-1, we cannot insert even if front has moved, causing false overflow. "
            "A Circular Queue solves this by wrapping indices around using modulo arithmetic: `rear = (rear + 1) % MAX_SIZE`.\n\n"
            "Conditions:\n"
            "1. IsEmpty: `front == -1 && rear == -1`\n"
            "2. IsFull: `(rear + 1) % MAX_SIZE == front`\n"
            "3. Enqueue: if empty, set `front = rear = 0`. Else `rear = (rear + 1) % MAX_SIZE`. Array[rear] = item.\n"
            "4. Dequeue: item = Array[front]. If `front == rear`, queue becomes empty, set `front = rear = -1`. Else `front = (front + 1) % MAX_SIZE`.\n\n"
            "C++ Snippet:\n"
            "```cpp\n"
            "#define MAX 5\n"
            "int queue[MAX], front = -1, rear = -1;\n"
            "void enqueue(int val) {\n"
            "    if ((rear + 1) % MAX == front) { cout << \"Queue Overflow!\\n\"; return; }\n"
            "    if (front == -1) front = 0;\n"
            "    rear = (rear + 1) % MAX;\n"
            "    queue[rear] = val;\n"
            "}\n"
            "int dequeue() {\n"
            "    if (front == -1) { cout << \"Queue Underflow!\\n\"; return -1; }\n"
            "    int val = queue[front];\n"
            "    if (front == rear) front = rear = -1;\n"
            "    else front = (front + 1) % MAX;\n"
            "    return val;\n"
            "}\n"
            "```\n"
            "Viva Tip: Time complexity for both Enqueue and Dequeue in Circular Queue is strictly O(1)."
        )
    },
    {
        "course_id": "CSE-212",
        "week_number": 12,
        "topic": "Graph Traversals and Shortest Path",
        "file_name": "dijkstra_shortest_path_notes.cpp",
        "content": (
            "QUEST Nawabshah CSE-212 DSA Week 12: Dijkstra's Single Source Shortest Path Algorithm\n"
            "Concept: Dijkstra finds shortest paths from a single source node to all other vertices in a weighted graph with non-negative edge weights.\n\n"
            "Greedy Strategy & Relaxation:\n"
            "Maintain a min-priority queue of `(distance, u)` pairs. Initially, `dist[source] = 0` and all other `dist[v] = infinity`.\n"
            "For edge (u, v) with weight w: If `dist[u] + w < dist[v]`, update `dist[v] = dist[u] + w` (Relaxation step) and push `(dist[v], v)` into the priority queue.\n\n"
            "Complexity:\n"
            "- Using Adjacency Matrix: O(V^2)\n"
            "- Using Adjacency List + Min-Heap/Priority Queue: O((V + E) log V)\n\n"
            "Exam Pitfall: Dijkstra FAILS on graphs with negative weight edges or negative cycles. For negative weights, use Bellman-Ford algorithm (O(V*E))."
        )
    },
    {
        "course_id": "CSE-212",
        "week_number": 1,
        "topic": "Pointers & Dynamic Memory",
        "file_name": "pointers_and_memory_management.cpp",
        "content": (
            "QUEST CSE-212 DSA Week 1: Pointers and Dynamic Memory Allocation in C/C++\n"
            "Pointers store memory addresses of variables. Dereferencing `*ptr` accesses the value stored at that address.\n\n"
            "Dynamic Memory Functions:\n"
            "- `malloc(size)`: Allocates uninitialized memory of `size` bytes. Returns `void*` or `NULL` if failed.\n"
            "- `calloc(num, size)`: Allocates and zeros out memory for `num` elements of `size` bytes.\n"
            "- `free(ptr)`: Deallocates memory on heap. Failing to free causes memory leaks.\n"
            "- Dangling Pointer: A pointer pointing to freed memory. Always set `ptr = NULL` after `free(ptr)`.\n\n"
            "Pointer Arithmetic:\n"
            "`ptr + 1` increments address by `sizeof(*ptr)` bytes. In arrays, `arr[i]` is identical to `*(arr + i)`."
        )
    },
    {
        "course_id": "CSE-212",
        "week_number": 4,
        "topic": "Stack Data Structure & Expression Parsing",
        "file_name": "stack_operations_and_postfix_lab.cpp",
        "content": (
            "QUEST Nawabshah CSE-212 DSA Lab #4: Stack Data Structure (LIFO) & Postfix Evaluation in C++\n"
            "Key Principle: LIFO (Last In First Out). Elements are inserted and deleted from the same end called `top`.\n\n"
            "Operations & Conditions:\n"
            "1. Push: Check `top == MAX - 1` (Stack Overflow). If not full, `top++` and `stack[top] = item`.\n"
            "2. Pop: Check `top == -1` (Stack Underflow). If not empty, return `stack[top--]`.\n"
            "3. Peek: Return `stack[top]` without removing.\n\n"
            "Expression Evaluation (Infix to Postfix):\n"
            "- Operands go straight to postfix output.\n"
            "- Operators are pushed to stack based on precedence (`^` > `*`, `/` > `+`, `-`).\n"
            "- Left parenthesis `(` pushed to stack; right parenthesis `)` pops stack until `(` is encountered.\n\n"
            "Viva Tip: Stack is used internally by CPU for function calls (Call Stack) and recursion backtrack."
        )
    },
    {
        "course_id": "CSE-212",
        "week_number": 3,
        "topic": "Linked Lists (Singly & Doubly)",
        "file_name": "linked_list_traversal_lab.cpp",
        "content": (
            "QUEST Nawabshah CSE-212 DSA Lab #3: Singly Linked List Implementation\n"
            "Structure:\n"
            "```cpp\n"
            "struct Node {\n"
            "    int data;\n"
            "    Node* next;\n"
            "    Node(int val) : data(val), next(nullptr) {}\n"
            "};\n"
            "```\n"
            "Insertion at Head: `newNode->next = head; head = newNode;` (O(1))\n"
            "Insertion at Tail: Traverse to last node `while(temp->next != nullptr)`, then `temp->next = newNode;` (O(N))\n"
            "Deletion: Handle head deletion by updating `head = head->next` and freeing old head. Always prevent memory leaks with `delete temp`."
        )
    },
    {
        "course_id": "CSE-305",
        "week_number": 5,
        "topic": "IP Addressing, CIDR & Subnetting",
        "file_name": "subnetting_and_cidr_guide.pdf",
        "content": (
            "QUEST CSE-305 Networks Lab #5: IP Addressing & Subnetting Guide\n"
            "IPv4 address is 32 bits divided into 4 octets. Default classes:\n"
            "- Class A: /8 (1.0.0.0 to 126.0.0.0)\n"
            "- Class B: /16 (128.0.0.0 to 191.255.0.0)\n"
            "- Class C: /24 (192.0.0.0 to 223.255.255.0)\n\n"
            "CIDR (Classless Inter-Domain Routing) & Usable Hosts Formula:\n"
            "Host bits = 32 - prefix_length\n"
            "Total IP addresses = 2^(Host bits)\n"
            "Usable host IP addresses = 2^(Host bits) - 2 (Subtracting Network ID and Broadcast IP).\n\n"
            "Example /26 Subnet:\n"
            "Prefix = /26 -> Host bits = 32 - 26 = 6 bits.\n"
            "Total addresses = 2^6 = 64.\n"
            "Usable hosts per subnet = 64 - 2 = 62 hosts.\n"
            "Subnet mask = 255.255.255.192 (/26 = 11000000 = 128 + 64 = 192)."
        )
    }
]

def seed_database() -> Dict[str, Any]:
    """
    Seeds the Supabase database with high-yield university peer notes.
    """
    total_indexed = 0

    for note in SEED_NOTES:
        chunks = semantic_chunk(note["content"], max_chars=450, overlap=80)
        embeddings = get_embeddings_batch(chunks)
        
        records = []
        for idx, (chunk_text, emb) in enumerate(zip(chunks, embeddings)):
            records.append({
                "content": chunk_text,
                "embedding": emb,
                "file_url": f"https://hxvutkqzluggauadxmlb.supabase.co/storage/v1/object/public/campuslore-notes/seed/{note['file_name']}",
                "file_name": note["file_name"],
                "course_id": note["course_id"],
                "week_number": note["week_number"],
                "topic": note["topic"],
                "chunk_index": idx,
                "metadata": {
                    "is_seed": True,
                    "total_chunks": len(chunks)
                }
            })
        
        inserted = insert_note_chunks(records)
        total_indexed += len(inserted) if inserted else len(records)

    return {
        "success": True,
        "message": f"Successfully seeded {total_indexed} high-yield note chunks across {len(SEED_NOTES)} key university topics.",
        "seeded_topics": [n["topic"] for n in SEED_NOTES],
        "total_chunks": total_indexed
    }
