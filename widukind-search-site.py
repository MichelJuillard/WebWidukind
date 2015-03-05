from flask import Flask, render_template, request, redirect, session
import pymongo
from elasticsearch import Elasticsearch
import os

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'very very secret key key key'
#app.secret_key = os.urandom(24)

def elasticsearch_query_datasets(query):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body={"query": {"query_string": {"query": query}}})
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        results.append({"datasetCode": s["datasetCode"], "name": s["name"]})
    return results

def elasticsearch_query_series(query):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', doc_type = 'series', size=20, body={"query": {"query_string": {"query": query}}})
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        results.append({"key": s["key"], "name": s["name"]})
    return results

@app.route('/')
def initial_page():
    return render_template('search_series.html')
#    return render_template('search_datasets.html')

@app.route('/facet1', methods = ['POST'])
def facet1():
    req = []
    if 'provider' in request.form.keys():
        req = request.form['provider']
    print(req)
    return redirect('/')

@app.route('/search_datasets', methods = ['POST'])
def search_datasets():
    query = request.form['query']
    results = elasticsearch_query_datasets(query)
    session['query'] = query
    session['results'] = results
    return render_template('search_datasets.html')

@app.route('/search_series', methods = ['POST'])
def search_series():
    query = request.form['query']
    results = elasticsearch_query_series(query)
    session['query'] = query
    session['results'] = results
    return render_template('search_series.html')





if __name__ == '__main__':
 #   app.debug = True
    app.run()
