'use strict';

const e = React.createElement;

class RatingItem {
    constructor(name, rating) {
        this.name = name;
        this.rating = rating;
    }

    link() {
        return "https://www.justwatch.com/us/search?q=" + encodeURIComponent(this.name);
    }
    stars() {
        return "★ ".repeat(this.rating).trimRight();
    }
}

class RatingList extends React.Component {
    render() {
        return this.props.items.map((item) => (
            <a href={item.link()}>
                <div className="entry">
                    <div className="name">{item.name}</div>
                    <div className="rating">{item.stars()}</div>
                </div>
            </a>
        ));
    }
}

class RatingStar extends React.Component {
    render() {
        const click = () => this.props.onClick(this.props.starVal)
        return <a onClick={click}>★</a>;
    }
}

class RatingStars extends React.Component {
    render() {
        return (
            <div className="star-select">
                { Array.from(
                    new Array(5),
                    (_, i) => <RatingStar starVal={5-i} onClick={this.props.onClick} />)
                }​​​​​​
            </div>
        )
    }
}

class RatingAddArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = { expanded: false }
    }

    setExpanded(state) {
        this.setState({ expanded: state })
    }

    render() {
        const expand = () => this.setExpanded(true);
        const unexpand = () => this.setExpanded(false);
        const inputIdTitle = this.props.id + "_input_title";
        const submit = this.props.onsubmit;

        function SubmitStars(starVal) {
            const titleVal = document.getElementById(inputIdTitle).value;
            if (!titleVal)
                return;

            unexpand();
            const data = {
                title: titleVal,
                stars: starVal,
            };
            submit(data);
        }

        function RatingForm() {
            return (
                <div className="form">
                    <input id={inputIdTitle} placeholder="Title" />
                    <RatingStars onClick={SubmitStars} />
                </div>
            );
        }

        function AddRatingButton() {
            return <button onClick={expand}>+</button>;
        }

        if (this.state.expanded)
            return <RatingForm />
        else
            return <AddRatingButton />
    }
}

function HandleColumn(domColumn, items) {
    const prefix = "col-";
    if (!domColumn.id.startsWith(prefix)) {
        console.error(".column has invalid child " + domColumn);
        return;
    }
    const key = domColumn.id.substr(prefix.length);
    const domRatingsList = domColumn.querySelector(".ratings-list");
    const domAddArea = domColumn.querySelector(".rating-add");
    
    function ItemSorter(first, second) {
        const cmp_rating = second.rating - first.rating;
        if (cmp_rating)
            return cmp_rating;
        return first.name.localeCompare(second.name, undefined, { sensitivity: 'accent' });
    }

    const category = items[key];
    category.sort(ItemSorter);

    ReactDOM.render(< RatingList items={category} />, domRatingsList);
    ReactDOM.render(
        < RatingAddArea
            id={key + "rating_add"}
            onsubmit={console.log} />,
        domAddArea
    );
} 


function dictMap(dict, fn) {
    return Object.keys(dict).reduce(function(acc, key) {
        acc[key] = fn(dict[key]);
        return acc;
    }, {});
}

function mapRatingItems(ratingMap) {
    return Object.keys(ratingMap).map(
        (title) => new RatingItem(title, ratingMap[title])
    );
}

const endpoint = "http://localhost:8080";
fetch(endpoint + "/reviews.json")
    .then(res => res.json())
    .then(result => dictMap(result, mapRatingItems))
    .then(
        (items) => {
            document.querySelectorAll(".column")
                .forEach(col => HandleColumn(col, items));
        },
        (error) => {
            console.error(error);
        }
    )