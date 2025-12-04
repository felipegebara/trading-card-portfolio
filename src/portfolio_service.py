from sqlalchemy import create_engine, Column, String, Numeric, Date, DateTime, Integer, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
from dotenv import load_dotenv
import os
import sys
import uuid

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

# Database connection
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
engine = create_engine(DATABASE_URL, echo=False)

# Create base class for models
Base = declarative_base()

# Define PortfolioCard model matching existing table structure
class PortfolioCard(Base):
    __tablename__ = 'portfolio_cards'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carta = Column(String, nullable=False)  # Nome da carta
    data_compra = Column(Date, nullable=False)  # Data de compra
    preco_compra = Column(Numeric, nullable=False)  # Preço de compra
    idioma = Column(String)  # Idioma
    qtd = Column(Integer, nullable=False)  # Quantidade
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    estado = Column(String)  # Condição (NM, LP, etc)
    user_id = Column(UUID(as_uuid=True))  # ID do usuário
    
    def __repr__(self):
        return f"<PortfolioCard(id={self.id}, carta='{self.carta}', qtd={self.qtd})>"
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'carta': self.carta,
            'data_compra': self.data_compra.isoformat() if self.data_compra else None,
            'preco_compra': float(self.preco_compra) if self.preco_compra else 0,
            'idioma': self.idioma,
            'qtd': self.qtd,
            'estado': self.estado,
            'user_id': str(self.user_id) if self.user_id else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database operations
class PortfolioCardService:
    def __init__(self):
        self.session = SessionLocal()
    
    def add_card(self, carta, data_compra, preco_compra, idioma='PT-BR', qtd=1, estado='NM', user_id=None):
        """Add a new card to the portfolio"""
        try:
            new_card = PortfolioCard(
                carta=carta,
                data_compra=data_compra,
                preco_compra=preco_compra,
                idioma=idioma,
                qtd=qtd,
                estado=estado,
                user_id=user_id
            )
            self.session.add(new_card)
            self.session.commit()
            print(f"[OK] Carta '{carta}' adicionada com sucesso! ID: {new_card.id}")
            return new_card.to_dict()
        except Exception as e:
            self.session.rollback()
            print(f"[ERROR] Erro ao adicionar carta: {e}")
            return None
    
    def get_all_cards(self, user_id=None):
        """Get all cards from the portfolio"""
        try:
            query = self.session.query(PortfolioCard).order_by(PortfolioCard.data_compra.desc())
            if user_id:
                query = query.filter(PortfolioCard.user_id == user_id)
            cards = query.all()
            return [card.to_dict() for card in cards]
        except Exception as e:
            print(f"[ERROR] Erro ao buscar cartas: {e}")
            return []
    
    def get_card_by_id(self, card_id):
        """Get a specific card by ID"""
        try:
            card = self.session.query(PortfolioCard).filter(PortfolioCard.id == card_id).first()
            return card.to_dict() if card else None
        except Exception as e:
            print(f"[ERROR] Erro ao buscar carta: {e}")
            return None
    
    def update_card(self, card_id, **kwargs):
        """Update a card's information"""
        try:
            card = self.session.query(PortfolioCard).filter(PortfolioCard.id == card_id).first()
            if card:
                for key, value in kwargs.items():
                    if hasattr(card, key):
                        setattr(card, key, value)
                self.session.commit()
                print(f"[OK] Carta ID {card_id} atualizada com sucesso!")
                return card.to_dict()
            else:
                print(f"[ERROR] Carta ID {card_id} não encontrada")
                return None
        except Exception as e:
            self.session.rollback()
            print(f"[ERROR] Erro ao atualizar carta: {e}")
            return None
    
    def delete_card(self, card_id):
        """Delete a card from the portfolio"""
        try:
            card = self.session.query(PortfolioCard).filter(PortfolioCard.id == card_id).first()
            if card:
                self.session.delete(card)
                self.session.commit()
                print(f"[OK] Carta ID {card_id} deletada com sucesso!")
                return True
            else:
                print(f"[ERROR] Carta ID {card_id} não encontrada")
                return False
        except Exception as e:
            self.session.rollback()
            print(f"[ERROR] Erro ao deletar carta: {e}")
            return False
    
    def get_portfolio_stats(self, user_id=None):
        """Get portfolio statistics"""
        try:
            cards = self.get_all_cards(user_id)
            total_invested = sum(card['preco_compra'] * card['qtd'] for card in cards)
            
            stats = {
                'total_cards': len(cards),
                'total_quantity': sum(card['qtd'] for card in cards),
                'total_invested': round(total_invested, 2),
                'cards_by_condition': {},
                'cards_by_language': {}
            }
            
            # Group by condition
            for card in cards:
                condition = card['estado'] or 'Unknown'
                stats['cards_by_condition'][condition] = stats['cards_by_condition'].get(condition, 0) + card['qtd']
            
            # Group by language
            for card in cards:
                language = card['idioma'] or 'Unknown'
                stats['cards_by_language'][language] = stats['cards_by_language'].get(language, 0) + card['qtd']
            
            return stats
        except Exception as e:
            print(f"[ERROR] Erro ao calcular estatísticas: {e}")
            return None
    
    def get_top_cards(self, limit=5):
        """Get top cards by purchase price"""
        try:
            cards = self.session.query(PortfolioCard).order_by(PortfolioCard.preco_compra.desc()).limit(limit).all()
            return [card.to_dict() for card in cards]
        except Exception as e:
            print(f"[ERROR] Erro ao buscar top cartas: {e}")
            return []
    
    def close(self):
        """Close the database session"""
        self.session.close()

# Example usage
if __name__ == "__main__":
    # Initialize service
    service = PortfolioCardService()
    
    print("\n" + "="*60)
    print(" PORTFOLIO DE CARTAS POKEMON - SUPABASE CONECTADO")
    print("="*60)
    
    # Get all cards
    print("\n[INFO] Todas as cartas no portfolio:")
    cards = service.get_all_cards()
    if cards:
        for i, card in enumerate(cards, 1):
            print(f"\n  {i}. {card['carta']}")
            print(f"     Data Compra: {card['data_compra']}")
            print(f"     Preço: R$ {card['preco_compra']:.2f}")
            print(f"     Quantidade: {card['qtd']}")
            print(f"     Estado: {card['estado']}")
            print(f"     Idioma: {card['idioma']}")
    else:
        print("  Nenhuma carta encontrada.")
    
    # Get portfolio stats
    print("\n" + "-"*60)
    print("[INFO] Estatísticas do Portfolio:")
    print("-"*60)
    stats = service.get_portfolio_stats()
    if stats:
        print(f"  Total de Cartas Únicas: {stats['total_cards']}")
        print(f"  Quantidade Total: {stats['total_quantity']}")
        print(f"  Total Investido: R$ {stats['total_invested']:.2f}")
        
        print(f"\n  Cartas por Estado:")
        for condition, count in stats['cards_by_condition'].items():
            print(f"    - {condition}: {count}")
        
        print(f"\n  Cartas por Idioma:")
        for language, count in stats['cards_by_language'].items():
            print(f"    - {language}: {count}")
    
    # Get top 5 most expensive cards
    print("\n" + "-"*60)
    print("[INFO] Top 5 Cartas Mais Caras:")
    print("-"*60)
    top_cards = service.get_top_cards(5)
    for i, card in enumerate(top_cards, 1):
        print(f"  {i}. {card['carta']} - R$ {card['preco_compra']:.2f}")
    
    # Close connection
    service.close()
    print("\n" + "="*60)
    print("[OK] Conexão fechada com sucesso!")
    print("="*60 + "\n")
