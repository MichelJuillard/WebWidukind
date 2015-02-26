from flask import Flask, render_template, request, redirect, session
import pymongo
from elasticsearch import Elasticsearch
import os

app = Flask(__name__)
#app.debug = True
app.config['SECRET_KEY'] = 'very very secret key key key'
#app.secret_key = os.urandom(24)

def elasticsearch_query(query):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', size=20, body={"query": {"query_string": {"query": query}}})
    print(res)
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        results.append({"datasetCode": s["datasetCode"], "name": s["name"]})
    print(results)
    return results

@app.route('/')
def hello_world():
    return render_template('search.html')

@app.route('/facet1', methods = ['POST'])
def facet1():
    req = []
    if 'provider' in request.form.keys():
        req = request.form['provider']
    print(req)
    return redirect('/')

@app.route('/search', methods = ['POST'])
def search():
    query = request.form['query']
    results = elasticsearch_query(query)
    session['results'] = results
    return redirect('/')

@app.route('/disp_results', methods = ['POST'])
def disp_results():
    query = request.form['query']
    session['query'] = query
    elasticsearch_query(query)
    return redirect('/disp_results')




if __name__ == '__main__':
 #   app.debug = True
    app.run()
