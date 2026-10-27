# Python mein “yeh kya return karta hai?”

Jab kisi function ka result samajh na aaye, pehle yeh dekho:

```python
result = some_function()
print(type(result))  # kis type ka result hai?
print(result)        # result ke andar kya hai?
```

Is page par common results ko chhote examples mein dikhaya hai. **Type** batata hai result kis tarah ki cheez hai; **value** batati hai uske andar kya aaya.

## Jaldi se yaad rakho

| Dikhta hai | Matlab | Example |
|---|---|---|
| `str` | text | `"hello"` |
| `int` | poora number | `5` |
| `float` | decimal number | `2.5` |
| `bool` | `True` ya `False` | `5 > 2` |
| `None` | koi value nahi | record nahi mila |
| `list` | items ki list | `[ticket1, ticket2]` |
| `tuple` | ek saath rakhi values | `(answer, evidence)` |
| `dict` | key aur value | `{"answer": "Hello"}` |

---

## Database query: tickets ke examples

### `.all()` — saare matching records ki list

```python
tickets = db.query(Ticket).all()
```

**Return:** `list`

```text
[Ticket object, Ticket object, ...]
```

Koi ticket na mile toh `[]` (empty list) milti hai. Har list item ek SQLAlchemy `Ticket` object hota hai.

### `.first()` — pehla record, ya `None`

```python
ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
```

**Return:** ek `Ticket` object, ya `None` agar match na mila.

### `.query()` — query instructions, records nahi

```python
query = db.query(Ticket)
```

**Return:** SQLAlchemy `Query` object. Yeh kehta hai, “Ticket table se records chahiye,” magar abhi records ki list nahi hai. `.all()` lagane par records aate hain.

### Database ke kuch aur common methods

```python
db.add(ticket)       # return: None; object ko session mein jodta hai
db.commit()          # return: None; pending changes database mein save karta hai
db.refresh(ticket)   # return: None; database se ticket ki latest values reload karta hai
db.delete(ticket)    # return: None; object ko delete ke liye mark karta hai
```

Yeh methods aksar koi useful value **return nahi** karte; inka kaam database/session par action karna hai.

---

## List, tuple aur dictionary

### List: kai items

```python
items = ["a", "b"]
```

List square brackets `[]` mein hoti hai. `.all()` bhi list return karta hai.

### Tuple: kai values ek result mein

```python
return answer, evidence
```

Comma ki wajah se yeh tuple return hota hai:

```text
("AI ka jawab...", "PDF se mila text...")
```

Dono ko alag variables mein lene ke liye:

```python
answer, evidence = generate_answers(db, question)
```

Ab `answer` aur `evidence` dono alag `str` hain.

### Dictionary: named keys ke saath data

```python
result = {"answer": "AI ka jawab", "evidence": "PDF ka text"}
```

**Type:** `dict`

Value key se milti hai:

```python
result["answer"]   # "AI ka jawab"
```

Tuple `(answer, evidence)` aur dictionary `{"answer": ..., "evidence": ...}` alag formats hain.

---

## FastAPI test response

```python
response = client.post("/documents/upload", files=...)
```

**Return:** HTTP `Response` object. Ismein status code aur response body hoti hai.

```python
response.status_code  # int, jaise 201 ya 400
response.text         # str, raw body
response.json()       # JSON body ko Python mein parse karta hai
```

Agar server yeh JSON bheje:

```json
{"id": "abc", "filename": "guide.pdf", "chunk_count": 4}
```

Toh `response.json()` Python dictionary deta hai:

```python
{"id": "abc", "filename": "guide.pdf", "chunk_count": 4}
```

Phir yeh check:

```python
assert "chunk_count" in response.json()
```

dictionary mein `chunk_count` key hone ki tasdeeq karta hai. `assert` kisi bhi expected condition ko check karta hai; yeh sirf server response ke liye nahi hota.

### File upload request ka shape

```python
files={"file": ("guide.pdf", file_object, "application/pdf")}
```

Tuple ka order:

```text
(filename, khuli hui file, content type)
```

`"file"` key FastAPI endpoint ke parameter naam se match honi chahiye, jaise `file: UploadFile = File(...)`.

---

## Pydantic: data object banana aur validate karna

```python
ticket = CreateTicket.model_validate(data)
```

**Return:** `CreateTicket` Pydantic object. Uske fields attributes ki tarah milte hain:

```python
ticket.subject
ticket.description
```

SQLAlchemy object ko response schema mein badalne ka example:

```python
ticket_response = TicketResponse.model_validate(ticket_from_database)
```

**Return:** `TicketResponse` object. ORM object ke attributes se fields padhne ke liye schema mein yeh hona chahiye:

```python
model_config = {"from_attributes": True}
```

`model_dump()` Pydantic object ko Python dictionary banata hai:

```python
ticket_response.model_dump()  # dict
```

### `response_model` khud kya karta hai?

```python
@router.get("/", response_model=list[TicketResponse])
def read_tickets(db: Session = Depends(get_db)):
    return get_all_tickets(db)
```

Repository list of SQLAlchemy `Ticket` objects deti hai. FastAPI `response_model` dekhkar list ke **har item** ko `TicketResponse` ke fields se validate/serialize karta hai, phir JSON array bhejta hai. Is case mein manual loop likhna zaroori nahi.

---

## LangChain / RAG: answer aur evidence

```python
output = (prompt | llm).invoke({"context": context, "question": question})
```

**Return:** LangChain `AIMessage` object. Yeh plain string nahi hota; generated text aam taur par `.content` mein hota hai:

```python
output.content  # usually str: model ka jawab
```

Tumhare RAG helper ka return:

```python
return output.content, context
```

**Return:** tuple of two strings. Is tarah receive karo:

```python
answer, evidence = generate_answers(db, question)
```

`search_chunks(...)` ke andar `.all()` hai, isliye yeh `DocumentChunk` objects ki list return karta hai:

```python
chunks = search_chunks(db, question)
chunks[0].content  # pehle chunk ka text
```

`"\n\n".join(...)` kai chunk strings ko ek string mein jodta hai, beech mein blank line rakhkar.

---

## Time: current time ya guzra hua waqt?

```python
time.time()       # float: Unix timestamp, seconds mein
time.perf_counter()  # float: elapsed duration naapne ke liye counter
```

Duration naapne ka example:

```python
start = time.perf_counter()
do_work()
elapsed_ms = int((time.perf_counter() - start) * 1000)
```

`elapsed_ms` ek `int` hai, jo kaam mein lage milliseconds batata hai. Readable calendar date/time ke liye `datetime` use hota hai:

```python
datetime.now()  # datetime object, current date aur time
```

---

## Chhoti Python cheezein jo aksar dikhti hain

```python
len(items)                       # int: items ki ginti
"\n\n".join(text_parts)           # str: strings ko jodta hai
print(value)                     # None: screen par dikhata hai
open(path, "rb").read()          # bytes: binary file ka content
open(path, "r").read()           # str: text file ka content
```

`with open(...) as f:` use karne par block khatam hote hi file band ho jaati hai:

```python
with open("guide.pdf", "rb") as f:
    pdf_bytes = f.read()  # bytes
```

---

## Jab sure na ho, yeh teen sawaal poochho

1. **Type kya hai?** `print(type(result))`
2. **Andar kya hai?** `print(result)` ya `print(result[0])` / `print(result["key"])`
3. **Ek value hai ya kai?** `list` = items ki list, `tuple` = fixed group, `dict` = named key-value data.

Type hints, jaise `-> list[Ticket]`, code padhne wale ko intended return batate hain. Python har type hint ko apne aap enforce nahi karta; implementation aur actual result dekho.
