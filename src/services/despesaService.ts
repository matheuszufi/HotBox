import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface DespesaHistorico {
  id: string;
  despesaId: string;
  acao: 'criacao' | 'edicao' | 'status_change' | 'exclusao';
  descricaoAlteracao: string;
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
}

export interface Despesa {
  id?: string;
  descricao: string;
  categoria: string;
  subcategoria?: string;
  fornecedor?: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  recorrente: boolean;
  frequencia?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  observacoes?: string;
  comprovante?: string;
  createdAt: string;
  updatedAt?: string;
  // Informações de auditoria
  criadoPor: {
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail: string;
  };
  alteradoPor?: {
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail: string;
  };
}

export interface CreateDespesaData {
  descricao: string;
  categoria: string;
  subcategoria?: string;
  fornecedor?: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  recorrente: boolean;
  frequencia?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  observacoes?: string;
  comprovante?: string;
  // Informações do usuário que está criando
  criadoPor: {
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail: string;
  };
}

class DespesaService {
  private collectionName = 'despesas';

  async createDespesa(despesaData: CreateDespesaData): Promise<string> {
    try {
      console.log('🔄 Criando nova despesa no Firebase:', despesaData);
      
      // Criar objeto limpo removendo campos undefined
      const cleanData: any = {
        descricao: despesaData.descricao,
        categoria: despesaData.categoria,
        valor: despesaData.valor,
        dataVencimento: despesaData.dataVencimento,
        status: despesaData.status,
        recorrente: despesaData.recorrente,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        criadoPor: despesaData.criadoPor
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (despesaData.subcategoria) {
        cleanData.subcategoria = despesaData.subcategoria;
      }
      if (despesaData.fornecedor) {
        cleanData.fornecedor = despesaData.fornecedor;
      }
      if (despesaData.dataPagamento) {
        cleanData.dataPagamento = despesaData.dataPagamento;
      }
      if (despesaData.formaPagamento) {
        cleanData.formaPagamento = despesaData.formaPagamento;
      }
      if (despesaData.frequencia && despesaData.recorrente) {
        cleanData.frequencia = despesaData.frequencia;
      }
      if (despesaData.observacoes) {
        cleanData.observacoes = despesaData.observacoes;
      }

      const docRef = await addDoc(collection(db, this.collectionName), cleanData);
      console.log('✅ Despesa criada com sucesso. ID:', docRef.id);
      
      // Criar histórico de criação
      await this.createHistoricoEntry(docRef.id, 'criacao', 'Despesa criada', despesaData.criadoPor.usuarioId, despesaData.criadoPor.usuarioNome, null, cleanData);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar despesa:', error);
      throw new Error('Erro ao salvar despesa no Firebase');
    }
  }

  async getAllDespesas(): Promise<Despesa[]> {
    try {
      console.log('🔄 Buscando todas as despesas...');
      
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const despesas: Despesa[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        despesas.push({
          id: doc.id,
          ...data
        } as Despesa);
      });

      console.log(`✅ ${despesas.length} despesas encontradas`);
      return despesas;
    } catch (error) {
      console.error('❌ Erro ao buscar despesas:', error);
      throw new Error('Erro ao carregar despesas do Firebase');
    }
  }

  async getDespesaById(id: string): Promise<Despesa | null> {
    try {
      console.log('🔄 Buscando despesa por ID:', id);
      
      const docSnap = await getDocs(query(collection(db, this.collectionName)));
      
      const despesa = docSnap.docs.find(doc => doc.id === id);
      
      if (despesa) {
        return {
          id: despesa.id,
          ...despesa.data()
        } as Despesa;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar despesa por ID:', error);
      throw new Error('Erro ao buscar despesa no Firebase');
    }
  }

  async updateDespesa(
    id: string, 
    despesaData: Partial<CreateDespesaData>,
    alteradoPor: {
      usuarioId: string;
      usuarioNome: string;
      usuarioEmail: string;
    }
  ): Promise<void> {
    try {
      console.log('🔄 Atualizando despesa:', id, despesaData);
      
      // Buscar dados atuais para histórico
      const despesaAtual = await this.getDespesaById(id);
      
      // Criar objeto limpo removendo campos undefined
      const cleanData: any = {
        updatedAt: new Date().toISOString(),
        alteradoPor
      };

      // Adicionar apenas campos que têm valor
      if (despesaData.descricao !== undefined) {
        cleanData.descricao = despesaData.descricao;
      }
      if (despesaData.categoria !== undefined) {
        cleanData.categoria = despesaData.categoria;
      }
      if (despesaData.valor !== undefined) {
        cleanData.valor = despesaData.valor;
      }
      if (despesaData.dataVencimento !== undefined) {
        cleanData.dataVencimento = despesaData.dataVencimento;
      }
      if (despesaData.status !== undefined) {
        cleanData.status = despesaData.status;
      }
      if (despesaData.recorrente !== undefined) {
        cleanData.recorrente = despesaData.recorrente;
      }
      if (despesaData.subcategoria) {
        cleanData.subcategoria = despesaData.subcategoria;
      }
      if (despesaData.fornecedor) {
        cleanData.fornecedor = despesaData.fornecedor;
      }
      if (despesaData.dataPagamento) {
        cleanData.dataPagamento = despesaData.dataPagamento;
      }
      if (despesaData.formaPagamento) {
        cleanData.formaPagamento = despesaData.formaPagamento;
      }
      if (despesaData.frequencia && despesaData.recorrente) {
        cleanData.frequencia = despesaData.frequencia;
      }
      if (despesaData.observacoes) {
        cleanData.observacoes = despesaData.observacoes;
      }
      
      const despesaRef = doc(db, this.collectionName, id);
      await updateDoc(despesaRef, cleanData);
      
      // Criar histórico de edição
      await this.createHistoricoEntry(
        id, 
        'edicao', 
        'Despesa editada', 
        alteradoPor.usuarioId, 
        alteradoPor.usuarioNome, 
        despesaAtual, 
        cleanData
      );
      
      console.log('✅ Despesa atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar despesa:', error);
      throw new Error('Erro ao atualizar despesa no Firebase');
    }
  }

  async deleteDespesa(id: string): Promise<void> {
    try {
      console.log('🔄 Excluindo despesa:', id);
      
      const despesaRef = doc(db, this.collectionName, id);
      await deleteDoc(despesaRef);
      
      console.log('✅ Despesa excluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir despesa:', error);
      throw new Error('Erro ao excluir despesa do Firebase');
    }
  }

  async updateDespesaStatus(id: string, status: Despesa['status']): Promise<void> {
    try {
      console.log('🔄 Atualizando status da despesa:', id, 'para:', status);
      
      const despesaRef = doc(db, this.collectionName, id);
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      // Se o status for 'pago' e não houver data de pagamento, adicionar
      if (status === 'pago') {
        updateData.dataPagamento = new Date().toISOString().split('T')[0];
      }
      
      await updateDoc(despesaRef, updateData);
      console.log('✅ Status da despesa atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar status da despesa:', error);
      throw new Error('Erro ao atualizar status da despesa no Firebase');
    }
  }

  async getDespesasByCategoria(categoria: string): Promise<Despesa[]> {
    try {
      console.log('🔄 Buscando despesas por categoria:', categoria);
      
      const q = query(
        collection(db, this.collectionName),
        where('categoria', '==', categoria),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const despesas: Despesa[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        despesas.push({
          id: doc.id,
          ...data
        } as Despesa);
      });

      console.log(`✅ ${despesas.length} despesas encontradas para categoria:`, categoria);
      return despesas;
    } catch (error) {
      console.error('❌ Erro ao buscar despesas por categoria:', error);
      throw new Error('Erro ao buscar despesas por categoria no Firebase');
    }
  }

  async getDespesasByStatus(status: Despesa['status']): Promise<Despesa[]> {
    try {
      console.log('🔄 Buscando despesas por status:', status);
      
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const despesas: Despesa[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        despesas.push({
          id: doc.id,
          ...data
        } as Despesa);
      });

      console.log(`✅ ${despesas.length} despesas encontradas para status:`, status);
      return despesas;
    } catch (error) {
      console.error('❌ Erro ao buscar despesas por status:', error);
      throw new Error('Erro ao buscar despesas por status no Firebase');
    }
  }

  async getDespesasVencidas(): Promise<Despesa[]> {
    try {
      console.log('🔄 Buscando despesas vencidas...');
      
      const hoje = new Date().toISOString().split('T')[0];
      
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'pendente'),
        orderBy('dataVencimento', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const despesas: Despesa[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const despesa = {
          id: doc.id,
          ...data
        } as Despesa;
        
        // Filtrar apenas as vencidas
        if (despesa.dataVencimento < hoje) {
          despesas.push(despesa);
        }
      });

      console.log(`✅ ${despesas.length} despesas vencidas encontradas`);
      return despesas;
    } catch (error) {
      console.error('❌ Erro ao buscar despesas vencidas:', error);
      throw new Error('Erro ao buscar despesas vencidas no Firebase');
    }
  }

  // Métodos para gerenciar histórico de alterações
  async createHistoricoEntry(
    despesaId: string,
    acao: DespesaHistorico['acao'],
    descricaoAlteracao: string,
    usuarioId: string,
    usuarioNome: string,
    dadosAnteriores?: any,
    dadosNovos?: any
  ): Promise<void> {
    try {
      const historicoData: Omit<DespesaHistorico, 'id'> = {
        despesaId,
        acao,
        descricaoAlteracao,
        usuarioId,
        usuarioNome,
        dataHora: new Date().toISOString(),
        dadosAnteriores,
        dadosNovos
      };

      // Tentar criar a coleção se não existir
      const historicoRef = collection(db, 'despesas_historico');
      await addDoc(historicoRef, historicoData);
      console.log('✅ Entrada de histórico criada para despesa:', despesaId);
    } catch (error) {
      console.error('❌ Erro ao criar entrada de histórico:', error);
      console.log('⚠️ Continuando sem salvar histórico - pode ser problema de permissões');
      // Não vamos lançar erro aqui para não impactar a operação principal
    }
  }

  async getHistoricoDespesa(despesaId: string): Promise<DespesaHistorico[]> {
    try {
      console.log('🔄 Buscando histórico da despesa:', despesaId);
      
      // Primeiro, tentar buscar sem orderBy para verificar se há problemas com índices
      const historicoRef = collection(db, 'despesas_historico');
      const q = query(
        historicoRef,
        where('despesaId', '==', despesaId)
      );
      
      const querySnapshot = await getDocs(q);
      const historico: DespesaHistorico[] = [];

      querySnapshot.forEach((doc) => {
        historico.push({
          id: doc.id,
          ...doc.data()
        } as DespesaHistorico);
      });

      // Ordenar manualmente por dataHora em ordem decrescente
      historico.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

      console.log(`✅ ${historico.length} entradas de histórico encontradas`);
      return historico;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico da despesa:', error);
      
      // Se der erro, retornar array vazio ao invés de throw
      console.log('⚠️ Retornando array vazio devido ao erro');
      return [];
    }
  }
}

export const despesaService = new DespesaService();
