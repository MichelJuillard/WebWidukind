var LeftFacets = React.createClass({displayName: "LeftFacets",
    getInitialState: function() {
	return { data: [] };
    },

    componentWillMount: function(props) {
	    $.get('/provider_facets',
	      {'code': this.props.code},
		  function(data){
		      if (this.isMounted()) {
			  this.setState({data: JSON.parse(data)});
		      }
	      }.bind(this));
    },

    __changeSelection: function(id) {
        var state = this.state.data.map(function(d) {
            return {
                id: d.id,
                selected: (d.id === id ? !d.selected : d.selected)
            };
        });
	
        this.setState({ data: state });
	
	var selection = [];
	for (var i=0; i < state.length; i++){
	    if (state[i].selected) selection.push(String(state[i].id).toLowerCase())
	}
	var filter = {provider: selection};
        this.props.handleFilter1(filter);
    },

    render: function() {
        var checks = this.state.data.map(function(d) {
            return (
		React.createElement("div", {key: d.id}, 
                    React.createElement("input", {type: "checkbox", checked: d.selected, onChange: this.__changeSelection.bind(this, d.id)}), 
		    d.id, 
		React.createElement("br", null)
		    )
            );
        }.bind(this));

        return (
		React.createElement("div", null, 
		React.createElement("h2", null, "Providers"), 
		React.createElement("form", null, 
                checks
            )
		)
        );
    },
});

var Dimension = React.createClass({displayName: "Dimension",
    getInitialState: function() {
	return { folded: true, data: [] };
    },

    componentWillMount: function() {
	var state = this.props.codes.map( function(d) {
	    return {
		id: d[0],
		name: d[1],
		selected: false
	    };
	});
	this.setState({data: state});
    },
    
    handleOnClick: function (id) {
	this.setState({folded: !this.state.folded});
    },

    __changeSelection: function(id,parent) {
        var state = this.state.data.map(function(d) {
            return {
		name: d.name,
                id: d.id,
                selected: (d.id === id ? !d.selected : d.selected)
            };
        });
	
        this.setState({ data: state });
	
	var selection = [];
	for (var i=0; i < state.length; i++){
	    if (state[i].selected) selection.push(String(state[i].id).toLowerCase())
	}
        this.props.handleFilter2(this.props.parent,selection);
    },
    
    render: function() {
	var codes = []
	if (!this.state.folded) {
            codes = this.state.data.map(function(d) {
		return (
			React.createElement("div", {key: d.id}, 
			React.createElement("input", {type: "checkbox", checked: d.selected, onChange: this.__changeSelection.bind(this, d.id, this.props.parent)}), 
			d.name, 
			React.createElement("br", null)
			)
		);
            }.bind(this));
	}
	
	return (
	    React.createElement("div", {key: this.props.id}, 
	    React.createElement("li", {onClick: this.handleOnClick.bind(this,this.props.id)}, 
	    this.props.name
	    ), 
		codes
	    )
	)
    }
});

var Dimensions = React.createClass({displayName: "Dimensions",
    render: function () {
	var self = this;
	var codes = [];
	if (this.props.data){
	    codes = $.map(this.props.data, function (codes,codename) {
		return React.createElement(Dimension, {key: codename, name: codename, parent: codename, codes: codes, handleFilter2: self.props.handleFilter2});
	    });
	}
	return (
		React.createElement("div", null, 
		React.createElement("h2", null, "Dimensions"), 
		codes
	)
    )
    }
});

var DatasetFacets = React.createClass({displayName: "DatasetFacets",
    getInitialState: function() {
	return { data: [] };
    },

    componentDidMount: function(props) {
	    $.get('/dataset_facets',
		  {'provider': this.props.provider, 'code': this.props.code},
		  function(data){
		      if (this.isMounted()){
			  this.setState({data: JSON.parse(data)});
		      }
	      }.bind(this));
    },
    onSelect: function (node) {
        if (this.state.selected && this.state.selected.isMounted()) {
            this.state.selected.setState({selected: false});
        }
        this.setState({selected: node});
        node.setState({selected: true});
        if (this.props.onCategorySelect) {
            this.props.onCategorySelect(node);
        }
    },
    render: function() {
            return (
//            <div className="panel panel-default">
//                <div className="panel-body">
//                    <ul className="category-tree">
//                        <TreeNode key={this.state.data.id} 
//                                data={this.state.data} 
	    //                                onCategorySelect={this.onSelect} />
		    React.createElement(Dimensions, {data: this.state.data, handleFilter2: this.props.handleFilter2})
//            </ul>
//                </div>
//            </div>
        );
    }
});

var ButtonDatasetInfos = React.createClass({displayName: "ButtonDatasetInfos",
    getInitialState: function() {
	return { results: [] };
    },

    componentWillUpdate: function(nextProps, nextState) {
	if (nextState.results.length) {
	    jQuery.facebox(nextState.results);
	}
    },
    
    handleButtonDatasetInfo: function(e) {
	    	e.preventDefault();
	    $.get('/dataset_info',
	      {'code': this.props.code},
	      function(data){
		  this.setState({results: data});
	      }.bind(this));
    },

    render: function() {
	return React.createElement("button", {onClick: this.handleButtonDatasetInfo}, "I");
    }
});
	    
var ButtonDatasetDownload = React.createClass({displayName: "ButtonDatasetDownload",
    getInitialState: function() {
	return { results: [] };
    },

    handleButtonDatasetDownload: function(e) {
	e.preventDefault();
//	window.open('/download_dataset?datasetCode='+this.props.code+'&dimensions.code2[]=Gross domestic product&dimensions.code2[]=Gross national income');
	if (this.props.code.length) {
	    window.open('/download_dataset?datasetCode='+this.props.code);
	}
    },

    render: function() {
	return React.createElement("button", {onClick: this.handleButtonDatasetDownload}, "D");
    }
});
	    
var ButtonSeriesDownload = React.createClass({displayName: "ButtonSeriesDownload",
    getInitialState: function() {
	return { results: [] };
    },

    handleButtonSeriesDownload: function(e) {
	e.preventDefault();
	if (this.props.code.length) {
	    window.open('/download_series?key='+this.props.code);
	}
    },

    render: function() {
	return React.createElement("button", {onClick: this.handleButtonSeriesDownload}, "D");
    }
});
	    
var ButtonSeriesPrint = React.createClass({displayName: "ButtonSeriesPrint",
    getInitialState: function() {
	return { results: [] };
    },

    componentWillUpdate: function(nextProps, nextState) {
	if (nextState.results.length) {
	    jQuery.facebox(nextState.results);
	}
    },
    
    handleButtonSeriesPrint: function(e) {
	    	e.preventDefault();
	    $.get('/print_series',
	      {'key': this.props.code},
		  function(html){
		  this.setState({results: html});
	      }.bind(this));
    },

    render: function() {
	return React.createElement("button", {onClick: this.handleButtonSeriesPrint}, "P");
    }
});
	    
var ButtonSeriesPlot = React.createClass({displayName: "ButtonSeriesPlot",
    getInitialState: function() {
	return { results: [] };
    },

    componentWillUpdate: function(nextProps, nextState) {
	if (nextState.results.length) {
	    mw = window.open('','SeriesPlot')
	    mw.document.write(nextState.results);
	}
    },
    
    handleButtonSeriesPlot: function(e) {
	    	e.preventDefault();
	    $.get('/plot_series',
	      {'key': this.props.code},
		  function(html){
		  this.setState({results: html});
	      }.bind(this));
    },

    render: function() {
	return React.createElement("button", {onClick: this.handleButtonSeriesPlot}, "G");
    }
});
	    
var DatasetsResult = React.createClass({displayName: "DatasetsResult",
    render: function() {
	var self = this;
	
	if (this.props.optionaldatasetcode) {
	    return (
		    React.createElement("div", null, 
		    React.createElement("tr", null, React.createElement("th", null, "this.props.code")), 
		    React.createElement("tr", null, 
		    React.createElement("td", null, this.props.provider), 
		    React.createElement("td", null, React.createElement("button", {onClick: this.props.handleDatasetSeries.bind(null,self.props.provider,self.props.code)}, " ", this.props.name)), 
		    React.createElement("td", null, React.createElement(ButtonDatasetInfos, {code: this.props.code})), 
		    React.createElement("td", null, React.createElement(ButtonDatasetDownload, {code: this.props.code}))
		    )
		    )
	    );
	} else {
	    return (
		    React.createElement("tr", null, 
		    React.createElement("td", null, this.props.provider), 
		    React.createElement("td", null, React.createElement("button", {onClick: this.props.handleDatasetSeries.bind(null,self.props.provider,self.props.code)}, " ", this.props.name)), 
		    React.createElement("td", null, React.createElement(ButtonDatasetInfos, {code: this.props.code})), 
		    React.createElement("td", null, React.createElement(ButtonDatasetDownload, {code: this.props.code}))
		    )
	    );
	}
    }});


var SeriesResult = React.createClass({displayName: "SeriesResult",
    render: function() {
	var provider = '';
	if (this.props.with_provider){
	    provider = React.createElement("td", null, this.props.provider);
	}
	return (
		React.createElement("tr", null, 
		provider, 
		React.createElement("td", null, this.props.name), 
		React.createElement("td", null, React.createElement(ButtonSeriesPrint, {code: this.props.code})), 
		React.createElement("td", null, React.createElement(ButtonSeriesDownload, {code: this.props.code})), 
		React.createElement("td", null, React.createElement(ButtonSeriesPlot, {code: this.props.code}))
		)
	);
    }
});


var SearchDatasetsResults = React.createClass({displayName: "SearchDatasetsResults",
    render: function() {
	var self = this
	var results = JSON.parse(this.props.results);
	
	return  React.createElement("div", null, React.createElement("table", null, 
	    React.createElement("thead", null, 
	    React.createElement("tr", null, React.createElement("th", null, "Provider"), React.createElement("th", null, "Dataset"))
	    ), 
	    React.createElement("tbody", null, 
	    results.map( function(r) {
		return React.createElement(DatasetsResult, {key: r.datasetCode, code: r.datasetCode, name: r.name, optionaldatasetcode: 0, provider: r.provider, handleDatasetSeries: self.props.handleDatasetSeries});
	    }
			)
	)
	));
    }});
		    
var SearchSeriesResults = React.createClass({displayName: "SearchSeriesResults",
    render: function() {
	var self = this;
	var results = JSON.parse(this.props.results);
	var header;
	if (self.props.with_provider)
	    header = React.createElement("tr", null, React.createElement("th", null, "Provider"), React.createElement("th", null, "Series name"));
	else
	    header = React.createElement("tr", null, React.createElement("th", null, "Series name"));
	    
	var table = results.map( function(r) {
	    return React.createElement(SeriesResult, {key: r.key, code: r.key, provider: r.provider, name: r.name, 
	    optionaldatasetcode: 0, with_provider: self.props.with_provider});
	});						       

	return( React.createElement("table", null, 
		React.createElement("thead", null, 
		header
		), 
		React.createElement("tbody", null, 
		table
		)
		))
    }});
		    
     
var SearchFormDatasets = React.createClass({displayName: "SearchFormDatasets",

    getInitialState: function() {
	return { searchString: '', results: [] };
    },

    handleChange: function(e) {
	this.setState ({searchString: e.target.value});
    },

    handleSubmit: function(e) {
	e.preventDefault();
	var data = "";
	if (this.state.searchString.length){
	    data = JSON.stringify({'query': this.state.searchString, 'filter': this.props.filter1});
	} else {
	    data = JSON.stringify({'query': null, 'filter': this.props.filter1});
	}
	$.ajax({
	    url: '/REST_datasets',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
    
    render: function() {
	var optionalSearchDatasetsResults;
	var results = "";
	
	if (this.state.results.length > 0){
	    optionalSearchDatasetsResults = React.createElement(SearchDatasetsResults, {results: this.state.results, handleDatasetSeries: this.props.handleDatasetSeries});
	}

		
	return 	React.createElement("div", null, 
	    React.createElement("div", null, 
	    React.createElement("form", null, 
	    React.createElement("input", {type: "text", value: this.state.searchString, onChange: this.handleChange, placeholder: "Search query ..."}), 
	    React.createElement("input", {type: "submit", onClick: this.handleSubmit, value: "Go"})
	    )
	    ), 
	    optionalSearchDatasetsResults
	    );
    }
});

var SearchFormSeries = React.createClass({displayName: "SearchFormSeries",

    getInitialState: function() {
	return { searchString: '*', results: [], filter1: {} };
    },

    
    handleChange: function(e) {
	this.setState ({searchString: e.target.value});
    },

    handleSubmitSeries: function(e) {
	e.preventDefault();
	var data = "";
	if (this.state.searchString){
	    data = JSON.stringify({'query': this.state.searchString, 'filter': this.props.filter1});
	} else {
	    data = JSON.stringify({'query': null, 'filter': this.props.filter1});
	}
	$.ajax({
	    url: '/REST_series',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
    
    componentWillReceiveProps: function(nextProps) {
	this.setState({filter1: nextProps.filter1});
    },

    componentDidMount: function() {
	console.log(this.state)
	var data = "";
	if (this.state.searchString){
	    data = JSON.stringify({'query': this.state.searchString, 'filter': this.state.filter1});
	} else {
	    data = JSON.stringify({'query': null, 'filter': this.state.filter1});
	}
	$.ajax({
	    url: '/REST_series',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
	
    render: function() {
	console.log(this.state)
	var optionalSearchResults;
	var results = "";
	

	if (this.state.results.length > 0){
	    optionalSearchResults = React.createElement(SearchSeriesResults, {results: this.state.results, with_provider: true});
	}
	console.log(optionalSearchResults)
	
	return React.createElement("div", null, 
	    React.createElement("div", null, 
	    React.createElement("form", null, 
	    React.createElement("input", {type: "text", value: this.state.searchString, onChange: this.handleChange, placeholder: "Search query ..."}), 
	    React.createElement("input", {type: "submit", onClick: this.handleSubmitSeries, value: "Go"})
	    )
	    ), 
	    optionalSearchResults
	    );
    }
});

var SearchFormDatasetSeries = React.createClass({displayName: "SearchFormDatasetSeries",

    getInitialState: function() {
	return { searchString: '', results: [] };
    },

    handleChangeDatasetSeries: function(e) {
	this.setState ({searchString: e.target.value});
    },

    handleSubmitDatasetSeries: function(e) {
	e.preventDefault();
	var data = "";
	if (this.state.searchString.length){
	    data = JSON.stringify({'query': this.state.searchString, 'filter': this.props.filters});
	} else {
	    data = JSON.stringify({'query': null, 'filter': this.props.filters});
	}
	$.ajax({
	    url: '/REST_series',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
    
    render: function() {
	var optionalResults;
	var results = "";
	
	if (this.state.results.length > 0){
	    optionalResults = React.createElement(SearchSeriesResults, {results: this.state.results, with_provider: false});
	}

		
	return React.createElement("div", null, 
	    React.createElement("div", null, 
	    React.createElement("form", null, 
	    React.createElement("input", {type: "text", value: this.state.searchString, onChange: this.handleChangeDatasetSeries, placeholder: "Search query ..."}), 
	    React.createElement("input", {type: "submit", onClick: this.handleSubmitDatasetSeries, value: "Go"})
	    )
	    ), 
	    optionalResults
	    );
    }
});

var WidukindSearchDatasets = React.createClass({displayName: "WidukindSearchDatasets",

    getInitialState: function() {
	return { filter1: [] };
    },

    handleFilter1: function(filter) {
	this.setState({filter1: filter})
    },
	
    render: function() {
	return (
		React.createElement("div", null, 
	        React.createElement("div", {id: "banner"}, 
  		  React.createElement("h1", null, "Widukind search"), 
		  React.createElement("p", {className: "lead"}, "A database of international macroeconomic data")
		), 

		React.createElement("div", {id: "main-inner-2"}, 
		React.createElement("div", {id: "main-inner-1"}, 
		
		React.createElement("div", {id: "facets1-2"}, 
		React.createElement(LeftFacets, {handleFilter1: this.handleFilter1})
		), 
		React.createElement("div", {id: "results-2"}, 
		React.createElement(SearchFormDatasets, {handleDatasetSeries: this.props.handleDatasetSeries, filter1: this.state.filter1})
 		)
		)

		)
	    )
	);
    }
});

var WidukindSearchSeries = React.createClass({displayName: "WidukindSearchSeries",

    getInitialState: function() {
	return { filter1: [] };
    },

    handleFilter1: function(filter) {
	this.setState({filter1: filter})
    },
	
    render: function() {
	return (
		React.createElement("div", null, 
	        React.createElement("div", {id: "banner"}, 
  		React.createElement("h1", null, "Widukind search"), 
		React.createElement("p", {className: "lead"}, "A database of international macroeconomic data")
		), 
		React.createElement("div", {id: "main-inner-2"}, 
		React.createElement("div", {id: "main-inner-1"}, 
		React.createElement("div", {id: "facets1-2"}, 
		React.createElement(LeftFacets, {handleFilter1: this.handleFilter1})
		), 
		React.createElement("div", {id: "results-2"}, 
		React.createElement(SearchFormSeries, {filter1: this.state.filter1})
 		)
		)
		)
		)
	);
    }
});

var WidukindSearchDatasetSeries = React.createClass({displayName: "WidukindSearchDatasetSeries",
    getInitialState: function() {
	return { filter2: {} };
    },

    handleFilter2: function(parent,filter) {
	filter_tmp = this.state.filter2;
	d = {}
	d[parent] = filter
	filter_tmp['dimensions'] = d
	this.setState({filter2: filter_tmp});
    },
	
    render: function() {
	var filters = this.state.filter2;
	filters.datasetCode = this.props.datasetCode;
	return (
		React.createElement("div", null, 
	        React.createElement("div", {id: "banner"}, 
  		  React.createElement("h1", null, "Widukind search"), 
		  React.createElement("p", {className: "lead"}, "A database of international macroeconomic data")
		), 

		React.createElement("div", {id: "main-inner-2"}, 
		React.createElement("div", {id: "main-inner-1"}, 
		
		React.createElement("div", {id: "facets1-2"}, 
		React.createElement(DatasetFacets, {provider: this.props.provider, code: this.props.datasetCode, handleFilter2: this.handleFilter2})
		), 
		React.createElement("div", {id: "results-2"}, 
		React.createElement(SearchFormDatasetSeries, {filters: filters})
 		)

		)
		)
	    )
	);
    }
});

var Menu = React.createClass({displayName: "Menu",

    getInitialState: function(){
        return { focused: 0 };
    },

    clicked: function(index){

        // The click handler will update the state with
        // the index of the focused menu entry

        this.setState({focused: index});
	this.props.menuChoice(this.props.items[index]);
    },

    render: function() {

        // Here we will read the items property, which was passed
        // as an attribute when the component was created

        var self = this;

        // The map method will loop over the array of menu entries,
        // and will return a new array with <li> elements.

        return (
	    React.createElement("div", null, 
		React.createElement("div", {id: "menu"}, 
                React.createElement("ul", null,  this.props.items.map(function(m, index){
		    
                    var style = '';
		    
                    if(self.state.focused == index){
                        style = 'focused';
                    }
        
                    // Notice the use of the bind() method. It makes the
                    // index available to the clicked function:
        
                    return React.createElement("li", {className: style, key: m, onClick: self.clicked.bind(self, index)}, m);
        
                })
		    
	    )
		)
		)
        );
    }
});

var Home = React.createClass({displayName: "Home",
    render: function(){
	return(
		React.createElement("div", {id: "homepage"}, 
		React.createElement("h1", null, "Widukind Search"), 
		React.createElement("p", null, " You can search either by datasets or by series ")
		)
	);
    }
});

var Datasets = React.createClass({displayName: "Datasets",
    render: function(){
	return(
		React.createElement(WidukindSearchDatasets, {handleDatasetSeries: this.props.handleDatasetSeries})
	);
    }
});

var DatasetSeries = React.createClass({displayName: "DatasetSeries",
    render: function(){
	return(
		React.createElement(WidukindSearchDatasetSeries, {provider: this.props.provider, datasetCode: this.props.datasetCode})
	);
    }
});

var Series = React.createClass({displayName: "Series",
    render: function(){
	return(
		React.createElement(WidukindSearchSeries, null)
	);
    }
});

var App = React.createClass({displayName: "App",
    
    
    getInitialState: function(){
	return {currentChoice: 'Home', provider: '', datasetCode: ''};
    },
    
    handleChoice: function(choice) {
	this.setState({currentChoice: choice})
    },
    
    handleDatasetSeries: function(provider, code) {
	this.setState({currentChoice: 'DatasetSeries', provider: provider, datasetCode: code})
    },

    render: function() {
	var optionalChoice;
	var self = this;

	switch (self.state.currentChoice) {
	case 'Home':
	    optionalChoice = React.createElement(Home, null);
	    break;
	case 'Datasets':
	    optionalChoice = React.createElement(Datasets, {handleDatasetSeries: self.handleDatasetSeries});
	    break;
	case 'DatasetSeries':
	    optionalChoice = React.createElement(DatasetSeries, {datasetCode: self.state.datasetCode});
	    break;
	case 'Series':
	    optionalChoice = React.createElement(Series, null);
	    break;
	default:
	    console.error("Oops, shouldn't arrive here");
	}

	    return(
		    React.createElement("div", null, 
		    React.createElement(Menu, {items: ['Home', 'Series', 'Datasets'], menuChoice: this.handleChoice}), 
		    optionalChoice
		)
	);
    }
});

React.render(
	React.createElement(App, null),
    document.body
);
