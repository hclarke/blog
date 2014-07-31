import hashlib
import six

from pelican import signals


def add_twitter(generator, metadata):
    slug = metadata['slug']
    slug_bytes = six.b(slug)
    h = hashlib.md5(slug_bytes).hexdigest()
    hashtag = "hc"+h[:4]
    metadata['hashtag'] = hashtag

def register():
    signals.article_generator_context.connect(add_twitter)