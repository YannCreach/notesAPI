const Sortable = require('sortablejs');
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