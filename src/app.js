const Sortable = require('sortablejs');
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