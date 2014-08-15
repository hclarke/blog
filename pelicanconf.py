#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = u'harrison'
SITENAME = u'hclarke'
SITEURL = 'http://hclarke.ca'

THEME = u'themes/pure'

TIMEZONE = 'Europe/Paris'

DEFAULT_LANG = u'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None

# Blogroll
LINKS =  ()

DEFAULT_PAGINATION = 10

# Uncomment following line if you want document-relative URLs when developing
RELATIVE_URLS = True

PLUGINS = ['inlineimages', 'render_math', 'hashtag']

STATIC_PATHS = ['scripts']