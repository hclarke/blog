import os
import logging
import shutil
 
from pelican import signals
from pelican.generators import Generator
from pelican.utils import mkdir_p
 
logger = logging.getLogger(__name__)
 
INLINE_STATIC_EXTENSIONS = ('png', 'jpeg', 'jpg', 'js', 'css')
 
class InlineImagesGenerator(Generator):

    def generate_output(self, writer):
        self._generate_output_for(writer, 'ARTICLE')
        self._generate_output_for(writer, 'PAGE')
 
    def _generate_output_for(self, writer, domain):
        for f in self.get_files(
                self.settings[domain + '_DIR'],
                exclude=self.settings[domain + '_EXCLUDES'],
                extensions=INLINE_STATIC_EXTENSIONS):
            source_path = os.path.join(self.path, f)
            save_as = os.path.join(self.output_path, f)
            mkdir_p(os.path.dirname(save_as))
            shutil.copy(source_path, save_as)
            logger.info('copying {} to {}'.format(f, save_as))
 
def get_generators(pelican):
    return InlineImagesGenerator
 
def register():
    signals.get_generators.connect(get_generators)
 