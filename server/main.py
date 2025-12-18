from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
import base64



from odoo_rpc import (
    authenticate,
    get_payslip_runs,
    get_payslip_details,
    render_report_pdf
)



app = FastAPI(title="App Colillas API", version="1.0.0")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class LoginRequest(BaseModel):
    username: str
    password: str

class LotesRequest(BaseModel):
    uid: int
    password: str

class PrintRequest(BaseModel):
    uid: int
    password: str
    lot_id: int
    username: str

# Endpoints
@app.post("/api/v1/auth/login")
async def login(request: LoginRequest):
    """Autenticar usuario en Odoo"""
    result = authenticate(request.username, request.password)
    if not result.get("success"):
        raise HTTPException(status_code=401, detail=result.get("message", "Error de autenticación"))
    return result

@app.post("/api/v1/nomina/lotes")
async def get_lotes(request: LotesRequest):
    """Obtener lotes de nómina"""
    runs = get_payslip_runs(request.uid, request.password)
    return runs

@app.post("/api/v1/nomina/print")
async def print_colillas(request: PrintRequest):
    """Generar PDF de colillas para un lote"""
    # 1. Obtener las colillas del lote para saber cuáles imprimir
    payslips = get_payslip_details(request.uid, request.password, request.lot_id)
    
    if not payslips:
        raise HTTPException(status_code=404, detail="No se encontraron colillas para este lote")
        
    payslip_ids = [p['id'] for p in payslips]
    
    # 2. Determinar qué reporte usar (Aguinaldo vs Normal)
    # Lógica basada en si alguna estructura contiene 'Aguinaldo'
    is_aguinaldo = any('Aguinaldo' in p.get('struct_name', '') for p in payslips)
    report_xml_id = 'l10n_ni_formatos_dgi.report_boleta_aguinaldo_template' if is_aguinaldo else 'l10n_ni_formatos_dgi.report_boleta_pago_template'
    
    # 3. Renderizar el reporte
    result = render_report_pdf(
        request.uid, 
        request.password, 
        report_xml_id, 
        payslip_ids,
        username=request.username
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
        
    # 4. Decodificar base64 y retornar como archivo binario
    try:
        pdf_bytes = base64.b64decode(result["pdf_data"])
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el PDF: {str(e)}")

# Carpeta de assets estáticos (frontend)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
