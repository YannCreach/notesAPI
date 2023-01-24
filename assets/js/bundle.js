(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const cardModule = require('./card');
const tagModule = require('./tags');
const utilsModule = require('./utils');
const listModule = require('./list');

var app = {

  init: function () {
    console.log('app.init !');
    app.addListenerToActions();
    app.getListsFromAPI();
    app.initDragNDrop();
  },

  initDragNDrop() {
    const listContainer = document.querySelector('#lists-container');
    Sortable.create(listContainer, {
      draggable: '.panel', // Optionnel
      onEnd: listModule.handleDragList
    });
  },

  addListenerToActions() {

    const addListButton = document.getElementById('addListButton');
    addListButton.addEventListener('click', listModule.showAddListModal);

    const closeModalButtons = document.querySelectorAll('.close');
    for (const button of closeModalButtons) {
      button.addEventListener('click', utilsModule.hideModals);
    }

    const addListForm = document.querySelector('#addListModal form');
    addListForm.addEventListener('submit', listModule.handleAddListForm);

    const addCardButtons = document.querySelectorAll('.button--add-card');
    for (const button of addCardButtons) {
      button.addEventListener('click', cardModule.showAddCardModal);
    }

    const addCardForm = document.querySelector('#addCardModal form');
    addCardForm.addEventListener('submit', cardModule.handleAddCardForm);

    const associateTagForm = document.querySelector('#addTagToCardModal form');
	  associateTagForm.addEventListener('submit', tagModule.associateTagToCard);
  },

  async getListsFromAPI() {
    try {
      const getAllLists = await fetch(utilsModule.base_url + '/list');
      allList = await getAllLists.json();
      //console.log(allList[0])
      allList.sort((a, b) => b.position - a.position);
      for (list of allList) {
        listModule.makeListInDOM(list);

        for (card of list.list_cart) {
          cardModule.makeCardInDOM(card);
          
          for(tag of card.tag){
            tagModule.makeTagInDOM(tag);
          }

        }
      }
    } catch (error) {
      alert('Impossible de récupérer les listes depuis l\'API !');
      console.error(error);
    }
  },

};



document.addEventListener('DOMContentLoaded', app.init);

module.exports = app;
},{"./card":2,"./list":3,"./tags":4,"./utils":5}],2:[function(require,module,exports){
const tagModule = require('./tags');
const utilsModule = require('./utils');

const cardModule = {
  
  showAddCardModal(event) {
    const listElement = event.target.closest('.panel');
    const listId = listElement.dataset.listId;
    const modal = document.querySelector('#addCardModal');
    modal.querySelector('input[name="list_id"]').value = listId;
    document.querySelector('#addCardModal').classList.add('is-active');
  },
  
  async handleAddCardForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formDataEntries = Object.fromEntries(formData);
    const listId = document.querySelector('input[name="list_id"]').value;

    try {
      const addCard = await fetch(utilsModule.base_url+'/cart', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formDataEntries.name,
          list_id: listId
        })
      });
      cardModule.makeCardInDOM(await addCard.json());
    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
    
    utilsModule.hideModals();
    event.target.reset();
  },

  handleDragCard(event) {
		
		// les cartes depuis la liste d'origine
		const previousListCards = event.from.querySelectorAll('.box');

		// Si la nouvelle liste est la même que celle d'origine, inutile de passer à la suite
		if (event.from === event.to) {
      cardModule.updateAllCards(previousListCards);
    } else {
      const targetListCards = event.to.querySelectorAll('.box');
      const listId = event.to.closest('.panel').dataset.listId;
      cardModule.updateAllCards(targetListCards, listId);
    }

		//les cartes depuis la liste cible
    

	},

  updateAllCards(cards, listId) {

		// Mettre à jour chaque carte
		cards.forEach(async (card, index) => {
      
      let cardContent = { position: index }

      if (listId) cardContent.list_id = listId;

			try {
				const response = await fetch(`${utilsModule.base_url}/cart/${card.dataset.cardId}`,{
					method: 'PATCH',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cardContent)
				});

				if (!response.ok) throw new Error(response.status);
				console.log('Tout s\'est bien passé ! Les cartes sont à jour');
				
			} catch (error) {
				console.error(error);
				alert('Impossible de déplacer la carte dans l\'API !');
			}

		})

	},

  makeCardInDOM(data) {
    const template = document.getElementById('template-card');
    const theGoodList = document.querySelector(`[data-list-id="${data.list_id}"]`);
    const newCard = document.importNode(template.content, true);
    newCard.querySelector('.card-name').textContent = data.name;
    newCard.querySelector('.box').dataset.cardId = data.id;
    newCard.querySelector('.box').style.backgroundColor = data.cart_color.name;
    newCard.querySelector('.card--edit--button').addEventListener('click', cardModule.editCardName);
    newCard.querySelector('.card--delete--button').addEventListener('click', cardModule.handleDeleteCard);
    newCard.querySelector('.button--edit-tag').addEventListener('click', tagModule.showTagModal);
    theGoodList.querySelector('.panel-block').appendChild(newCard);
    
  },

  editCardName(event){
    
    const form = event.target.closest('.column').querySelector('form');
    form.classList.remove('is-hidden');
    form.addEventListener('submit', cardModule.handleEditCardForm);
  },

  async handleEditCardForm(event){
    event.preventDefault();
    console.log( event.target)
    const formData = new FormData(event.target);
    const formDataEntries = Object.fromEntries(formData);
    const cardId = event.target.closest('.box').getAttribute('data-card-id');

    try {
      await fetch(utilsModule.base_url+'/cart/'+cardId, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formDataEntries.name,
        })
      });

      event.target.parentElement.parentElement.querySelector('.card-name').textContent = formDataEntries.name;
      event.target.classList.add('is-hidden')

    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }

  },

  async handleDeleteCard(event){

    console.log( event.target)
    const cardId = event.target.closest('.box').getAttribute('data-card-id');
    const confirmation = confirm('Etes vous sûr de vouloir supprimer cette carte ?');
    
    if (confirmation) {
      try {
        await fetch(utilsModule.base_url+'/cart/'+cardId, {
          method: 'DELETE'
        });

        event.target.closest('.box').parentElement.removeChild(event.target.closest('.box'));
  
      } catch (error) {
        console.trace(error);
        res.status(500).json(error.toString());
      }
    }

  },

}

module.exports = cardModule;
},{"./tags":4,"./utils":5}],3:[function(require,module,exports){
const cardModule = require('./card');
const utilsModule = require('./utils');

const listModule = {

  showAddListModal() {
    const modal = document.getElementById('addListModal');
    modal.classList.add('is-active');
  },

  async handleAddListForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const formDataEntries = Object.fromEntries(formData);
    
    try {
      const addList = await fetch(utilsModule.base_url+'/list', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formDataEntries.name,
          kanban_id: 1
        })
      });
      listModule.makeListInDOM(await addList.json());
    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }

    utilsModule.hideModals();
    //event.target.reset();
  },

    
  handleDragList(event){
    const listsDOM = Array.from(event.target.children);
		
    listsDOM.forEach(async (listDOM, index) => {

			try {
				const response = await fetch(`${utilsModule.base_url}/list/${listDOM.dataset.listId}`, {
					method: 'PATCH',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            position: index,
          })
				});

				await response.json();

				if (!response.ok) throw new Error(response.status);

			} catch (error) {
				console.error(error);
				alert('Impossible de déplacer la liste dans l\'API !');
			}

		});

  },

  makeListInDOM(list) {
    const template = document.getElementById('template-list');
    const newList = document.importNode(template.content, true);
    newList.querySelector('h2').textContent = list.name;
    newList.querySelector('.panel').dataset.listId = list.id;
    newList.querySelector('.panel').id = `list_${list.id}`;
    newList.querySelector('.button--add-card').addEventListener('click', cardModule.showAddCardModal);
    newList.querySelector('h2').addEventListener('dblclick', listModule.editListName);
    newList.querySelector('.list--delete--button').addEventListener('click', listModule.handleDeleteList);

    const cardContainer = newList.querySelector('.panel-block');
		Sortable.create(cardContainer, {
			draggable: '.box',
			animation: 150,
			group: 'list',
			onEnd: cardModule.handleDragCard
		});

    const listContainer = document.querySelector('#lists-container');
    const firstList = listContainer.querySelector('.panel');

    if (firstList) {
      firstList.before(newList);
    } else {
      listContainer.appendChild(newList);
    }

  },

  editListName(event){
    event.target.parentElement.querySelector('form').classList.remove('is-hidden');
    event.target.parentElement.querySelector('form').addEventListener('submit', listModule.handleEditListForm);
  },

  async handleEditListForm(event){
    event.preventDefault();

    const formData = new FormData(event.target);
    const formDataEntries = Object.fromEntries(formData);
    const listId = event.target.closest('.panel').getAttribute('data-list-id');

    try {
      await fetch(utilsModule.base_url+'/list/'+listId, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formDataEntries.name,
        })
      });

      event.target.parentElement.querySelector('h2').textContent = formDataEntries.name;
      event.target.classList.add('is-hidden')

    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
    
    //event.target.reset();
  },

  async handleDeleteList(event){

    console.log( event.target)
    const listId = event.target.closest('.panel').getAttribute('data-list-id');
    const confirmation = confirm('Etes vous sûr de vouloir supprimer cette liste ?');
    
    if (confirmation) {
      try {
        await fetch(utilsModule.base_url+'/list/'+listId, {
          method: 'DELETE'
        });

        event.target.closest('.panel').parentElement.removeChild(event.target.closest('.panel'));
  
      } catch (error) {
        console.trace(error);
        res.status(500).json(error.toString());
      }
    }

  },

}

module.exports = listModule;
},{"./card":2,"./utils":5}],4:[function(require,module,exports){
const utilsModule = require('./utils');

const tagModule = {
  
  makeTagInDOM(tag) {
		const tagDOM = document.createElement('span');
		tagDOM.dataset.tagId = tag.id;
		tagDOM.textContent = tag.name;
		//tagDOM.style.backgroundColor = tag.color;
 
		// On lui donne la class Bulma
		tagDOM.classList.add('tag');
console.log(tag)
		const cardDOM = document.querySelector(`[data-card-id="${tag.cart_has_tag.cart_id}"]`);
		cardDOM.querySelector('.tags').appendChild(tagDOM);
  },

  async showTagModal(event) {

		const modal = document.querySelector('#addTagToCardModal');

		// Récupérer l'id de la carte sur laquelle le tag doit être associé
		const cardDOM = event.target.closest('.box');
		const cardId = cardDOM.dataset.cardId;

		// On insède l'id de la carte en valeur de l'input cachée
		modal.querySelector('input[name="card_id"]').value = cardId;

		const select = modal.querySelector('select[name="tag_id"]');
		select.textContent = '';

		try {
			
			const response = await fetch(`${utilsModule.base_url}/tag`);

			if (!response.ok) throw new Error(response.status);

			const tagsArray = await response.json();

			console.log(tagsArray);

			const tagsDOM = cardDOM.querySelectorAll('.tag');

			// si la carte possède déjà tous les tags, inutile d'aller plus loin : ferme la modal
			if (tagsDOM.length === tagsArray.length) return utilsModule.hideModals();

			// Pour chaque tag on va créer une balise option à insérer dans le select
			for (const tag of tagsArray) {

				// On crée la balise option
				const option = document.createElement('option');
				option.textContent = tag.name;
				option.value = tag.id;
				select.appendChild(option);
				
			}			

		} catch (error) {
			console.error(error);
			alert('Impossible de récupérer tous les tags !');
		}

		modal.classList.add('is-active');

	},

	async associateTagToCard(event) {
		event.preventDefault();

		const formData = new FormData(event.target);
    const formDataEntries = Object.fromEntries(formData);

		try {
			
			// Faire un appel API en POST sur /cards/:id/tags pour associer un tag à sa carte
			const response = await fetch(`${utilsModule.base_url}/cart/${formData.get('cart_id')}/tags`, {
				method: 'POST',
				headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formDataEntries.name,
        })
			});

			if (!response.ok) throw new Error(response.status);

			const json = await response.json();

			for (const tag of json.tags) {
				tagModule.makeTagInDOM(tag);
			}

		} catch (error) {
			console.error(error);	
		}

		utilsModule.hideModals();

	}


}

module.exports = tagModule;
},{"./utils":5}],5:[function(require,module,exports){
const utilsModule = {
  
  base_url: 'http://localhost:3000/api',

  hideModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('is-active');
    });
  },


}

module.exports = utilsModule;
},{}]},{},[1]);
