import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Spinner from "../spinner/Spinner";
import ErrorMessage from "../erorrMessage/ErorrMessage";

import useMarvelService from "../../services/MarvelService";
import "./charList.scss";

const SetContent = (process, Component, newItemLoading) => {
  switch (process) {
    case "waiting":
      return <Spinner />;

    case "loading":
      return newItemLoading ? <Component /> : <Spinner />;
    case "confirmed":
      return <Component />;
    case "error":
      return <ErrorMessage />;
    default:
      throw new Error("unexpected process state ");
  }
};

const CharList = (props) => {
  const { error, loading, getAllCharacters, process, setProcess } =
    useMarvelService();

  const [charList, setCharList] = useState([]);

  const [newItemLoading, setNewItemLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [charEnded, setCharEnded] = useState(false);

  useEffect(() => {
    onRequest(offset, true);
  }, []);

  const onRequest = (offset, initial) => {
    initial ? setNewItemLoading(false) : setNewItemLoading(true);

    getAllCharacters(offset)
      .then(onCharListLoaded)
      .then(() => setProcess("confirmed"));
  };

  const onCharListLoaded = (newCharList) => {
    let ended = false;
    if (newCharList.length < 9) {
      ended = true;
    }

    setCharList((charList) => [...charList, ...newCharList]);

    setNewItemLoading((newItemLoading) => false);
    setOffset((offset) => offset + 9);
    setCharEnded((charEnded) => ended);
  };

  const itemRefs = useRef([]);

  const focusOnItem = (id) => {
    // Я реализовал вариант чуть сложнее, и с классом и с фокусом
    // Но в теории можно оставить только фокус, и его в стилях использовать вместо класса
    // На самом деле, решение с css-классом можно сделать, вынеся персонажа
    // в отдельный компонент. Но кода будет больше, появится новое состояние
    // и не факт, что мы выиграем по оптимизации за счет бОльшего кол-ва элементов

    // По возможности, не злоупотребляйте рефами, только в крайних случаях
    itemRefs.current.forEach((item) =>
      item.classList.remove("char__item_selected")
    );
    itemRefs.current[id].classList.add("char__item_selected");
    itemRefs.current[id].focus();
  };

  // Этот метод создан для оптимизации,
  // чтобы не помещать такую конструкцию в метод render
  function renderItems(arr) {
    const items = arr.map((item, i) => {
      let imgStyle = { objectFit: "cover" };
      if (
        item.thumbnail ===
        "http://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available.jpg"
      ) {
        imgStyle = { objectFit: "unset" };
      }

      return (
        <CSSTransition key={item.id} timeout={500} classNames="char__item">
          <li
            className="char__item"
            tabIndex={0}
            ref={(el) => (itemRefs.current[i] = el)}
            onClick={() => {
              props.onCharSelected(item.id);
              focusOnItem(i);
            }}
            onKeyPress={(e) => {
              if (e.key === " " || e.key === "Enter") {
                props.onCharSelected(item.id);
                focusOnItem(i);
              }
            }}
          >
            <img src={item.thumbnail} alt={item.name} style={imgStyle} />
            <div className="char__name">{item.name}</div>
          </li>
        </CSSTransition>
      );
    });

    return (
      <ul className="char__grid">
        <TransitionGroup component={null}>{items}</TransitionGroup>
      </ul>
    );
  }

  const elements = useMemo(() => {
    return SetContent(process, () => renderItems(charList), newItemLoading);
  }, [process]);

  return (
    <div className="char__list">
      {elements}
      <button
        className="button button__main button__long"
        disabled={newItemLoading}
        style={{ display: charEnded ? "none" : "block" }}
        onClick={() => onRequest(offset)}
      >
        <div className="inner">load more</div>
      </button>
    </div>
  );
};

CharList.propTypes = {
  onCharSelected: PropTypes.func.isRequired,
};

export default CharList;
