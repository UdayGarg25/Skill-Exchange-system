from fastapi import FastAPI, HTTPException, Query
from app.Service.products import get_all_products

app = FastAPI()

@app.get('/')
def root() :
    return {"message": "welcome to Fast api."}

# @app.get('/products/{id}')
# def get_products(id:int) :
#     products = ['brush','charger','laptop','honey']
#     return products[id] 


# @app.get('/products')
# def get_products() :
#     return get_all_products()

@app.get("/products") 
def list_products(name:str = Query(
    default=None,
    min_length=1,
    max_length=50,
    description="Search Product by name (case insensitive)"
    ),
    sort_by_price:bool = Query(default=False, description="sort product by price"),

    order:str = Query(default="asc",description="sort order when sort_by_price=true (asc,desc)"),
        limit:int = Query(
    default=10,
    ge=1,
    le=100,
    description="number of items to return"
    ),
    ) :


    products = get_all_products()

    if name :
        needle = name.strip().lower()
        products = [p for p in products if needle in p.get("name","").lower()]

    if not products :
        raise HTTPException(status_code=404,detail=f"no matching product found name={name}")
        
    if sort_by_price:
        reverse = order == "desc"
        products = sorted(products,key=lambda p:p.get("price",0),reverse=reverse)
    total = len(products)
    products = products[0:limit]
    return {
        "total":total,
        "items":products
    }