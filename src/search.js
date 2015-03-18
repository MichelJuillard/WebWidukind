var Menu = React.createClass({

    getInitialState: function(){
        return { focused: 0 };
    },

    clicked: function(index){

        // The click handler will update the state with
        // the index of the focused menu entry

        this.setState({focused: index});
    },

    render: function() {

        // Here we will read the items property, which was passed
        // as an attribute when the component was created

        var self = this;

        // The map method will loop over the array of menu entries,
        // and will return a new array with <li> elements.

        return (
            <div>
                <ul>{ this.props.items.map(function(m, index){
        
                    var style = '';
        
                    if(self.state.focused == index){
                        style = 'focused';
                    }
        
                    // Notice the use of the bind() method. It makes the
                    // index available to the clicked function:
        
                    return <li className={style} onClick={self.clicked.bind(self, index)}>{m}</li>;
        
                }) }
                        
                </ul>
                
                <p>Selected: {this.props.items[this.state.focused]}</p>
            </div>
        );

    }
});

var SearchForm = React.createClass({

    getInitialState: function() {
	return { searchString: '' };
    },

    handleChange: function(e) {
	this.setState ({searchString: e.target.value});
    },

    render: function() {
	return <div>
	    <div className="lead">
	    <input type="text" value={this.state.searchString} onChange={this.handleChange} placeholder="Search query ..." />
	    </div>
	    </div>;
    }
});

var WidukindSearch = React.createClass({
    render: function() {
	return (
		<div>
		<div id="menu">
		<Menu items={ ['Search series', 'Search datasets', 'Options', 'Your account'] } />
		</div>
	        <div id="banner">
  		  <h1>Widukind search</h1>
		  <p className="lead">A database of international macroeconomic data</p>
		</div>

		<div id="main-inner-3">
		<div id="main-inner-2">
		<div id="main-inner-1">
		
		<div id="facets1-3">
		facet 1
		</div>
		<div id="results-3">
		<SearchForm />
 		</div>
		<div id="facets2-3">
		facet 2
		</div>

	        </div>
		</div>
		</div>
	    </div>
	);
    }
});

React.renderComponent(
	<WidukindSearch />,
    document.body
);
