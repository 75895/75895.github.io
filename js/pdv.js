
// Arquivo: /home/ubuntu/restaurante_system/frontend/js/pdv.js

import { API_BASE_URL } from './config.js';

let carrinho = [];
let produtosDisponiveis = [];

const produtosList = document.getElementById('produtos-list');
const carrinhoList = document.getElementById('carrinho-list');
const totalDisplay = document.getElementById('total-display');
const subtotalDisplay = document.getElementById('subtotal-display');
const finalizarVendaBtn = document.getElementById('finalizar-venda-btn');
const limparCarrinhoBtn = document.getElementById('limpar-carrinho-btn');
const searchProduto = document.getElementById('search-produto');

// --- Funções de Inicialização e Busca ---

async function fetchProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
        }
        produtosDisponiveis = await response.json();
        renderProdutos(produtosDisponiveis);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos. Verifique a conexão com o backend.');
    }
}

// --- Funções de Renderização ---

function renderProdutos(produtos) {
    produtosList.innerHTML = '';
    if (produtos.length === 0) {
        produtosList.innerHTML = '<p class="col-span-3 text-center text-gray-500">Nenhum produto encontrado.</p>';
        return;
    }

    produtos.forEach(produto => {
        const precoFormatado = parseFloat(produto.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const card = document.createElement('div');
        card.className = 'bg-gray-50 p-4 rounded-lg shadow hover:shadow-md transition duration-150 cursor-pointer text-center border border-gray-200';
        card.innerHTML = `
            <p class="font-bold text-lg">${produto.nome}</p>
            <p class="text-purple-600 font-semibold">${precoFormatado}</p>
            <button class="mt-2 text-sm bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 add-to-cart-btn" 
                    data-produto-id="${produto.id}" 
                    data-produto-nome="${produto.nome}" 
                    data-produto-preco="${produto.preco_venda}">
                Adicionar
            </button>
        `;
        produtosList.appendChild(card);
    });
    
    // Adiciona o listener de evento aos novos botões
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', handleAddToCart);
    });
}

function renderCarrinho() {
    carrinhoList.innerHTML = '';
    let subtotal = 0;

    if (carrinho.length === 0) {
        carrinhoList.innerHTML = '<p class="text-center text-gray-500">Carrinho vazio.</p>';
        subtotalDisplay.textContent = 'R$ 0,00';
        totalDisplay.textContent = 'R$ 0,00';
        finalizarVendaBtn.disabled = true;
        limparCarrinhoBtn.disabled = true;
        return;
    }

    carrinho.forEach((item, index) => {
        const precoUnitario = parseFloat(item.preco);
        const precoTotalItem = precoUnitario * item.quantidade;
        subtotal += precoTotalItem;

        const precoTotalFormatado = precoTotalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex justify-between items-center border-b pb-2';
        itemDiv.innerHTML = `
            <div class="flex flex-col">
                <span class="font-semibold">${item.nome}</span>
                <span class="text-sm text-gray-500">${item.quantidade} x ${precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div class="flex items-center space-x-2">
                <span class="font-bold">${precoTotalFormatado}</span>
                <button class="text-red-500 hover:text-red-700 text-sm remove-item-btn" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
        carrinhoList.appendChild(itemDiv);
    });

    // Atualiza os totais
    subtotalDisplay.textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    totalDisplay.textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); // Sem desconto por enquanto

    finalizarVendaBtn.disabled = false;
    limparCarrinhoBtn.disabled = false;

    // Adiciona o listener de evento aos novos botões de remoção
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', handleRemoveFromCart);
    });
}

// --- Funções de Manipulação do Carrinho ---

function handleAddToCart(event) {
    const button = event.currentTarget;
    const id = parseInt(button.dataset.produtoId);
    const nome = button.dataset.produtoNome;
    const preco = parseFloat(button.dataset.produtoPreco);

    const itemExistente = carrinho.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ id, nome, preco, quantidade: 1 });
    }

    renderCarrinho();
}

function handleRemoveFromCart(event) {
    const index = parseInt(event.currentTarget.dataset.index);
    carrinho.splice(index, 1);
    renderCarrinho();
}

function handleLimparCarrinho() {
    carrinho = [];
    renderCarrinho();
}

// --- Funções de Venda ---

async function handleFinalizarVenda() {
    if (carrinho.length === 0) {
        alert('O carrinho está vazio.');
        return;
    }

    if (!confirm('Confirmar a finalização da venda? O estoque será atualizado.')) {
        return;
    }

    finalizarVendaBtn.disabled = true;
    finalizarVendaBtn.textContent = 'Processando...';

    const itensParaEnvio = carrinho.map(item => ({
        produto_id: item.id,
        quantidade: item.quantidade
    }));

    try {
        const response = await fetch(`${API_BASE_URL}/vendas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itens: itensParaEnvio })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro desconhecido ao registrar a venda.');
        }

        alert(data.message);
        handleLimparCarrinho(); // Limpa o carrinho após o sucesso

    } catch (error) {
        console.error('Erro na finalização da venda:', error);
        alert('Erro ao finalizar a venda: ' + error.message);
    } finally {
        finalizarVendaBtn.disabled = false;
        finalizarVendaBtn.textContent = 'Finalizar Venda';
    }
}

// --- Funções de Busca ---

searchProduto.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const produtosFiltrados = produtosDisponiveis.filter(produto => 
        produto.nome.toLowerCase().includes(searchTerm)
    );
    renderProdutos(produtosFiltrados);
});

// --- Event Listeners ---

finalizarVendaBtn.addEventListener('click', handleFinalizarVenda);
limparCarrinhoBtn.addEventListener('click', handleLimparCarrinho);

// --- Inicialização ---
fetchProdutos();
renderCarrinho(); // Renderiza o carrinho vazio na inicialização

