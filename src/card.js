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