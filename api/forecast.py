from http.server import BaseHTTPRequestHandler
import json
import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # Ler dados do request
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Preparar dados para Prophet
            # Formato esperado: {"historical": [{"date": "2024-01-01", "price": 100}, ...]}
            df = pd.DataFrame(data['historical'])
            df.columns = ['ds', 'y']  # Prophet requer essas colunas específicas
            df['ds'] = pd.to_datetime(df['ds'])
            
            # Criar e treinar modelo Prophet
            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=False,
                interval_width=0.95,  # 95% intervalo de confiança
                changepoint_prior_scale=0.05  # Sensibilidade a mudanças de tendência
            )
            model.fit(df)
            
            # Fazer previsão para os próximos 7 dias
            future = model.make_future_dataframe(periods=7)
            forecast = model.predict(future)
            
            # Pegar apenas os últimos 7 dias (forecast)
            forecast_data = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(7)
            
            # Converter para formato JSON-friendly
            result = {
                'forecast': [
                    {
                        'date': row['ds'].strftime('%Y-%m-%d'),
                        'predicted': float(row['yhat']),
                        'lower': float(row['yhat_lower']),
                        'upper': float(row['yhat_upper'])
                    }
                    for _, row in forecast_data.iterrows()
                ],
                'success': True,
                'message': 'Forecast gerado com sucesso'
            }
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            # Em caso de erro, retornar mensagem de erro
            error_result = {
                'success': False,
                'error': str(e),
                'message': 'Erro ao gerar forecast'
            }
            self.wfile.write(json.dumps(error_result).encode())
        
    def do_OPTIONS(self):
        # Handle preflight CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
