if exists('g:loaded_fall_highlight')
  finish
endif
let g:loaded_fall_highlight = 1

function! s:init() abort
  if has('nvim')
    highlight default link FillNormal FloatNormal
    highlight default link FillBorder FloatBorder
  else
    highlight default link FillNormal Normal
    highlight default link FillBorder EndOfBuffer
  endif

  " Input
  highlight default link FillInputHeader FillBorder
  highlight default link FillInputCounter FillBorder
  highlight default link FillInputCursor Cursor

  " List
  highlight default link FillListMatch Search
  highlight default link FillListSelected CurSearch
  sign define FillListSelected text=≫
endfunction

augroup fall_plugin_highlight
  autocmd!
  autocmd ColorScheme * call s:init()
augroup END

call s:init()
